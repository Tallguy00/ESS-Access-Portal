// A frontend proxy client that mimics the Supabase JS client interface,
// sending all operations securely to the Express backend (/api/...)
// to achieve a robust full-stack architecture.

async function apiCall(endpoint, data) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      return { data: null, error: errRes.error || { message: `HTTP error ${response.status}` } };
    }
    
    return await response.json();
  } catch (err) {
    console.error(`API Call to ${endpoint} failed:`, err);
    return { data: null, error: { message: err.message || "Network request failed" } };
  }
}

// Keep track of auth state listeners
const authListeners = new Set();

// Cache active session in localStorage
let activeSession = null;
try {
  const savedSession = localStorage.getItem("ar_active_session");
  if (savedSession) {
    activeSession = JSON.parse(savedSession);
  }
} catch (e) {
  console.warn("Could not load cached session:", e);
}

function notifyAuthListeners(event, session) {
  authListeners.forEach((callback) => {
    try {
      callback(event, session);
    } catch (err) {
      console.error("Auth listener callback error:", err);
    }
  });
}

// Global window message listener to intercept successful popup OAuth authentication
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    const origin = event.origin;
    if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return;
    }
    if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.session) {
      console.log("OAuth Authentication successful! Storing session...", event.data.session);
      activeSession = event.data.session;
      localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
      notifyAuthListeners("SIGNED_IN", activeSession);
    }
  });
}

export const supabase = {
  auth: {
    async getSession() {
      const res = await apiCall("/api/auth/session", { session: activeSession });
      if (res.refreshedSession) {
        activeSession = res.refreshedSession;
        localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
      } else if (res.data?.session) {
        activeSession = res.data.session;
        localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
      } else {
        activeSession = null;
        localStorage.removeItem("ar_active_session");
      }
      return { data: { session: activeSession }, error: res.error || null };
    },

    async getUser() {
      const res = await apiCall("/api/auth/user", { session: activeSession });
      if (res.refreshedSession) {
        activeSession = res.refreshedSession;
        localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
        notifyAuthListeners("SIGNED_IN", activeSession);
      }
      return { data: { user: res.data?.user || null }, error: res.error || null };
    },

    onAuthStateChange(callback) {
      authListeners.add(callback);
      // Trigger initially so App.tsx is notified of any pre-cached session immediately
      setTimeout(() => {
        try {
          callback(activeSession ? "SIGNED_IN" : "SIGNED_OUT", activeSession);
        } catch (e) {
          console.error("Initial auth state trigger failed:", e);
        }
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            },
          },
        },
      };
    },

    async signInWithPassword({ email, password }) {
      const res = await apiCall("/api/auth/login", { email, password });
      if (res.data?.session) {
        activeSession = res.data.session;
        localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
        notifyAuthListeners("SIGNED_IN", activeSession);
      }
      return { data: res.data || {}, error: res.error || null };
    },

    async signUp({ email, password, options }) {
      const res = await apiCall("/api/auth/signup", { email, password, options });
      if (res.data?.session) {
        activeSession = res.data.session;
        localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
        notifyAuthListeners("SIGNED_IN", activeSession);
      }
      return { data: res.data || {}, error: res.error || null };
    },

    async signOut() {
      const res = await apiCall("/api/auth/logout", { session: activeSession });
      activeSession = null;
      localStorage.removeItem("ar_active_session");
      notifyAuthListeners("SIGNED_OUT", null);
      return { error: res.error || null };
    },

    async signInWithOtp({ email, options }) {
      const res = await apiCall("/api/auth/login-otp", { email, options });
      return { data: res.data || {}, error: res.error || null };
    },

    async verifyOtp({ email, token, type }) {
      const res = await apiCall("/api/auth/verify-otp", { email, token, type });
      if (res.data?.session) {
        activeSession = res.data.session;
        localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
        notifyAuthListeners("SIGNED_IN", activeSession);
      }
      return { data: res.data || {}, error: res.error || null };
    },

    async signInWithOAuth({ provider, options }) {
      const currentOrigin = window.location.origin;
      const callbackUrl = `${currentOrigin}/auth/callback`;
      
      const res = await apiCall("/api/auth/oauth-url", { 
        provider, 
        options: {
          ...options,
          redirectTo: callbackUrl
        } 
      });
      if (res.error) {
        return { data: null, error: res.error };
      }
      if (res.data?.url) {
        window.location.href = res.data.url;
        return { data: { provider, url: res.data.url }, error: null };
      }
      return { data: null, error: { message: "Could not generate authorization URL" } };
    },

    async updateUser({ data }) {
      const res = await apiCall("/api/auth/update-user", { data, session: activeSession });
      if (res.data?.session) {
        activeSession = res.data.session;
        localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
      }
      return { data: res.data || {}, error: res.error || null };
    },
  },

  // Database Query builder
  from(tableName) {
    const queryBuilder = {
      tableName,
      chain: [],
      select(columns) {
        this.chain.push({ method: "select", args: [columns] });
        return this;
      },
      insert(data) {
        this.chain.push({ method: "insert", args: [data] });
        return this;
      },
      upsert(data) {
        this.chain.push({ method: "upsert", args: [data] });
        return this;
      },
      update(data) {
        this.chain.push({ method: "update", args: [data] });
        return this;
      },
      delete() {
        this.chain.push({ method: "delete", args: [] });
        return this;
      },
      eq(column, value) {
        this.chain.push({ method: "eq", args: [column, value] });
        return this;
      },
      neq(column, value) {
        this.chain.push({ method: "neq", args: [column, value] });
        return this;
      },
      order(column, options) {
        this.chain.push({ method: "order", args: [column, options] });
        return this;
      },
      or(filter) {
        this.chain.push({ method: "or", args: [filter] });
        return this;
      },
      single() {
        this.chain.push({ method: "single", args: [] });
        return this;
      },
      // thenable protocol to act exactly like a Promise
      async then(onfulfilled, onrejected) {
        try {
          const res = await apiCall("/api/db/query", {
            table: this.tableName,
            chain: this.chain,
            session: activeSession,
          });
          
          if (res.refreshedSession) {
            activeSession = res.refreshedSession;
            localStorage.setItem("ar_active_session", JSON.stringify(activeSession));
            notifyAuthListeners("SIGNED_IN", activeSession);
          }
          
          const output = { data: res.data, error: res.error || null };
          if (onfulfilled) {
            return onfulfilled(output);
          }
          return output;
        } catch (err) {
          const output = { data: null, error: { message: err.message || "Query failed" } };
          if (onrejected) {
            return onrejected(err);
          }
          return output;
        }
      },
    };
    return queryBuilder;
  },

  // Storage proxy
  storage: {
    from(bucketName) {
      return {
        bucketName,
        async upload(filePath, fileBody, options) {
          try {
            let base64Data = "";
            let contentType = "";
            if (fileBody) {
              contentType = fileBody.type || "";
              const buffer = await fileBody.arrayBuffer();
              const bytes = new Uint8Array(buffer);
              let binary = "";
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              base64Data = btoa(binary);
            }
            const res = await apiCall("/api/storage/upload", {
              bucket: this.bucketName,
              path: filePath,
              fileBase64: base64Data,
              contentType,
              options,
            });
            return { data: res.data, error: res.error || null };
          } catch (err) {
            console.error("Storage upload helper failed:", err);
            return { data: null, error: { message: err.message || "File upload failed" } };
          }
        },

        async remove(filePaths) {
          const res = await apiCall("/api/storage/delete", {
            bucket: this.bucketName,
            paths: filePaths,
          });
          return { data: res.data, error: res.error || null };
        },

        getPublicUrl(filePath) {
          const supabaseUrl = "https://kbqlhumzcfenjumhaznf.supabase.co";
          return {
            data: {
              publicUrl: `${supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`,
            },
          };
        },
      };
    },
  },

  // Real-time updates subscription proxy (with polling fallback to ensure robust sync without iframe blocking)
  channel(channelName) {
    let intervalId = null;
    return {
      channelName,
      on(event, filter, callback) {
        this.callback = callback;
        return this;
      },
      subscribe(statusCallback) {
        if (statusCallback) {
          setTimeout(() => statusCallback("SUBSCRIBED"), 50);
        }
        // Poll every 5 seconds to simulate realtime database notifications
        intervalId = setInterval(() => {
          if (this.callback) {
            try {
              this.callback({ eventType: "UPDATE", new: {}, old: {} });
            } catch (err) {
              console.warn("Realtime simulation callback error:", err);
            }
          }
        }, 5000);
        return this;
      },
      unsubscribe() {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      },
    };
  },

  removeChannel(channel) {
    if (channel && typeof channel.unsubscribe === "function") {
      channel.unsubscribe();
    }
    return Promise.resolve();
  },
};
