import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  HelpCircle, 
  User, 
  KeyRound, 
  Bell, 
  CheckSquare, 
  Shield, 
  LifeBuoy, 
  ChevronDown, 
  ChevronUp, 
  BookOpen,
  Sparkles
} from 'lucide-react';
import HighlightText from './HighlightText';
import SearchInput from './SearchInput';

export type FAQCategory = 
  | 'Account' 
  | 'Access Requests' 
  | 'Notifications' 
  | 'Approvals' 
  | 'Security' 
  | 'Technical Support';

export interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Access Requests',
    question: 'How do I submit a new access request?',
    answer: 'Navigate to New Request, complete the required fields, and submit the form. You can track its progress in My Requests.'
  },
  {
    id: 'faq-2',
    category: 'Access Requests',
    question: 'How can I check the status of my request?',
    answer: 'Open My Requests to view statuses such as Pending, Approved, Rejected, or Completed.'
  },
  {
    id: 'faq-3',
    category: 'Access Requests',
    question: 'Can I edit a request after submitting it?',
    answer: 'Requests can only be edited while they are in the Draft state. Submitted requests cannot be modified unless returned by an approver.'
  },
  {
    id: 'faq-4',
    category: 'Approvals',
    question: 'Why was my request rejected?',
    answer: 'Open the request details to view the rejection reason provided by the approver.'
  },
  {
    id: 'faq-5',
    category: 'Notifications',
    question: 'How will I know when my request is approved?',
    answer: 'You will receive an in-app notification and, if enabled, an email notification.'
  },
  {
    id: 'faq-6',
    category: 'Security',
    question: 'How do I change my password?',
    answer: 'Go to Profile → Security and select Change Password.'
  },
  {
    id: 'faq-7',
    category: 'Account',
    question: 'How do I update my profile information?',
    answer: 'Open Profile Settings, edit your information, and save your changes.'
  },
  {
    id: 'faq-8',
    category: 'Technical Support',
    question: 'Who should I contact if I need help?',
    answer: 'Contact your system administrator or the IT support team using the Support page.'
  },
  {
    id: 'faq-9',
    category: 'Access Requests',
    question: 'How do I request urgent or expedited review for my request?',
    answer: 'You can toggle the "Urgent Priority" status indicator during request creation. This alerts Department Managers and IT Admins of critical deadlines. You can also open an urgent ticket via the Support channel if immediate escalation is necessary.'
  },
  {
    id: 'faq-10',
    category: 'Approvals',
    question: 'How long do access request approvals typically take?',
    answer: 'Standard department requests are typically processed within 24 to 48 business hours by your designated supervisor or manager. System-level security clearances may require additional security review by IT Admins.'
  },
  {
    id: 'faq-11',
    category: 'Security',
    question: 'How does Multi-Factor Authentication (MFA) work and how do I reset it?',
    answer: 'MFA is enforced across the IdentityFlow gateway to satisfy modern zero-trust policies. If you are locked out or need to register a new authenticator token, submit an "MFA Lockout / Reset" support ticket in the Support tab. An IT Admin will verify your identity and generate a reset link.'
  },
  {
    id: 'faq-12',
    category: 'Account',
    question: 'What do the different workspace roles mean (User, Manager, IT Support)?',
    answer: 'Your workspace role determines your access: "User" is the standard level for submitting/tracking personal requests. "Manager" enables supervisors to review and approve departmental access and bulk workflows. "IT Support" and "IT Admin" possess system-wide view, user administration, and security control privileges.'
  },
  {
    id: 'faq-13',
    category: 'Security',
    question: 'What are the "Session Parameters" displayed on the sidebar?',
    answer: 'Session parameters display your active identity governance state, including your connection security level, MFA enforcement compliance, and Cloud Run host tunnel architecture. This ensures full auditing compliance for corporate data access.'
  }
];

const CATEGORIES: { name: FAQCategory; icon: React.ComponentType<any>; color: string; bg: string }[] = [
  { name: 'Account', icon: User, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { name: 'Access Requests', icon: KeyRound, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { name: 'Notifications', icon: Bell, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { name: 'Approvals', icon: CheckSquare, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { name: 'Security', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { name: 'Technical Support', icon: LifeBuoy, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' }
];

export default function FAQView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'All'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Memoized filter logic
  const filteredFaqs = useMemo(() => {
    return DEFAULT_FAQS.filter(faq => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        faq.question.toLowerCase().includes(searchLower) || 
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.category.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  // Count per category (based on current search)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DEFAULT_FAQS.forEach(faq => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        faq.question.toLowerCase().includes(searchLower) || 
        faq.answer.toLowerCase().includes(searchLower);

      if (matchesSearch) {
        counts[faq.category] = (counts[faq.category] || 0) + 1;
      }
    });
    return counts;
  }, [searchTerm]);

  const totalResults = filteredFaqs.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            <span>Frequently Asked Questions</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Find answers to common questions about accounts, access privileges, security policies, and workflow management.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-full shrink-0">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{DEFAULT_FAQS.length} Guidelines Available</span>
        </div>
      </div>

      {/* Search and Categories Quick Filter */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Search bar */}
        <SearchInput
          id="faq-search"
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setExpandedId(null); // Collapse when searching to avoid layout jumps
          }}
          placeholder="Search FAQs by keywords (e.g. 'rejection', 'status', 'password')..."
        />

        {/* Categories Pills */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">
            Filter by Category
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="faq-cat-all"
              onClick={() => {
                setSelectedCategory('All');
                setExpandedId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-150 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {DEFAULT_FAQS.length}
              </span>
            </button>

            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat.name] || 0;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  id={`faq-cat-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setExpandedId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-150 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${selectedCategory === cat.name ? 'text-white' : cat.color}`} />
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                      selectedCategory === cat.name ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {totalResults === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <Search className="w-5 h-5" />
            </div>
            <div className="font-bold text-gray-900 dark:text-white">No FAQs found</div>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              No matching questions found for "{searchTerm}". Try checking your spelling or filtering by a specific category instead.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setExpandedId(null);
              }}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Clear Search Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3" id="faq-accordion-list">
            <AnimatePresence initial={false}>
              {filteredFaqs.map(faq => {
                const isOpen = expandedId === faq.id;
                const catObj = CATEGORIES.find(c => c.name === faq.category) || CATEGORIES[0];
                const CatIcon = catObj.icon;

                return (
                  <div 
                    key={faq.id}
                    className={`bg-white dark:bg-gray-900 border rounded-2xl transition-all shadow-xs overflow-hidden ${
                      isOpen 
                        ? 'border-blue-200 dark:border-blue-900/60 ring-1 ring-blue-100 dark:ring-blue-950/40' 
                        : 'border-gray-100 dark:border-gray-800/80 hover:border-gray-200 dark:hover:border-gray-700/80'
                    }`}
                  >
                    {/* Header trigger button */}
                    <button
                      id={`faq-trigger-${faq.id}`}
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full text-left p-5 flex items-start justify-between gap-4 focus:outline-none"
                    >
                      <div className="space-y-2">
                        {/* Category tag */}
                        <div className="flex items-center gap-1.5">
                          <span className={`p-1 rounded-md ${catObj.bg} ${catObj.color}`}>
                            <CatIcon className="w-3 h-3" />
                          </span>
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            {faq.category}
                          </span>
                        </div>
                        {/* Question */}
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight leading-snug">
                          <HighlightText text={faq.question} search={searchTerm} />
                        </h3>
                      </div>
                      
                      {/* Accordion toggle indicator */}
                      <span className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-1 shrink-0`}>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>

                    {/* Accordion content with smooth framer-motion slide-expand */}
                    <motion.div
                      id={`faq-content-${faq.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: isOpen ? 'auto' : 0, 
                        opacity: isOpen ? 1 : 0 
                      }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-gray-50 dark:border-gray-800/50">
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                          <HighlightText text={faq.answer} search={searchTerm} />
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Suggestion banner or quick tip */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10 border border-blue-100/40 dark:border-blue-950/20 rounded-2xl p-5 flex items-start gap-4 mb-6">
        <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white">Did not find what you were looking for?</h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            If your specific concern is not covered, you can open a direct request under the <strong className="text-blue-600 dark:text-blue-400 font-bold">New Access Request</strong> option or reach out directly to the support desk.
          </p>
        </div>
      </div>

    </div>
  );
}
