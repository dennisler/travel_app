import React from 'react';
import { 
  Check, 
  Lock, 
  Sparkles, 
  MapPin, 
  CalendarDays, 
  TicketCheck, 
  FileText 
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';

interface StepConfig {
  id: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const STEPS: StepConfig[] = [
  { id: 1, title: 'Preferences', subtitle: 'Vibes & Discovery', icon: Sparkles },
  { id: 2, title: 'Confirm', subtitle: 'Destination & Flights', icon: MapPin },
  { id: 3, title: 'Itinerary', subtitle: 'Days & Weather Mode', icon: CalendarDays },
  { id: 4, title: 'Bookings', subtitle: 'Hotels & Transit', icon: TicketCheck },
  { id: 5, title: 'Summary', subtitle: 'Share & Export', icon: FileText },
];

export const Stepper: React.FC = () => {
  const { activeTab, setActiveTab, completedTabs, isReadOnly } = useTripStore();

  const handleStepClick = (stepId: 1 | 2 | 3 | 4 | 5) => {
    if (isReadOnly) {
      setActiveTab(stepId);
      return;
    }

    // Step 1 is always unlocked
    if (stepId === 1) {
      setActiveTab(1);
      return;
    }

    // A step is unlocked if all previous steps (1 to stepId - 1) are completed
    const isUnlocked = completedTabs.includes((stepId - 1) as any) || completedTabs.includes(stepId);
    if (isUnlocked) {
      setActiveTab(stepId);
    }
  };

  return (
    <nav 
      aria-label="Trip planning steps" 
      className="no-print h-14 bg-slate-950/60 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between shrink-0 select-none overflow-x-auto"
    >
      <div className="flex items-center gap-1 sm:gap-2 w-full max-w-5xl mx-auto">
        {STEPS.map((step, idx) => {
          const isActive = activeTab === step.id;
          const isCompleted = completedTabs.includes(step.id);
          const isUnlocked = isReadOnly || step.id === 1 || completedTabs.includes((step.id - 1) as any) || isCompleted;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step Tab Button */}
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                disabled={!isUnlocked}
                className={`flex-1 min-w-[120px] max-w-[210px] h-10 px-2 sm:px-3 rounded-lg flex items-center gap-2 sm:gap-2.5 transition-all duration-200 text-left focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                  isActive
                    ? 'bg-indigo-600/15 border border-indigo-500/40 text-white shadow-sm'
                    : isUnlocked
                    ? 'hover:bg-slate-900 border border-transparent text-slate-300 cursor-pointer'
                    : 'opacity-40 border border-transparent text-slate-500 cursor-not-allowed'
                }`}
                title={!isUnlocked ? `Complete previous step to unlock ${step.title}` : step.title}
              >
                {/* Step indicator circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/40'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isUnlocked
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : !isUnlocked ? (
                    <Lock className="w-3 h-3 text-slate-500" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* Step labels */}
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <span className={`text-xs font-semibold truncate ${isActive ? 'text-indigo-200' : 'text-slate-200'}`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate hidden sm:block">
                    {step.subtitle}
                  </span>
                </div>
              </button>

              {/* Connecting line between steps */}
              {idx < STEPS.length - 1 && (
                <div 
                  className={`hidden md:block w-4 h-0.5 rounded transition ${
                    completedTabs.includes(step.id) ? 'bg-indigo-500/50' : 'bg-slate-800'
                  }`} 
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
