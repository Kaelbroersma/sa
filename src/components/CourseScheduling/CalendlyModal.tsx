import React, { useEffect } from 'react';
import { InlineWidget } from 'react-calendly';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle?: string;
  courseDuration?: string;
  coursePrice?: number;
}

const CalendlyModal: React.FC<CalendlyModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  courseDuration,
  coursePrice
}) => {
  // Get URL based on course ID
  const getCalendlyUrl = () => {
    // Map course IDs to specific Calendly event links
    const courseUrls: Record<string, string> = {
      '1': 'https://calendly.com/kaelbroersma/comprehensive-maintenance',
      '2': 'https://calendly.com/kaelbroersma/fundamentals-of-marksmanship',
      '3': 'https://calendly.com/kaelbroersma/30min',
      '4': 'https://calendly.com/kaelbroersma/positional-field-training',
    };
    
    return courseUrls[courseId] || 'https://calendly.com/your-account/training-session';
  };

  // Listen for Calendly booking confirmation
  useEffect(() => {
    const handleCalendlyEvent = (e: any) => {
      if (e.data.event === 'calendly.event_scheduled') {
        // Handle successful booking
        console.log('Event scheduled!', e.data.payload);
        // You can redirect to a confirmation page or show a success message
        // You can also use this data to create an order in your database
        onClose();
      }
    };
    
    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
  }, [onClose]);

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      
      {/* Full-screen container for modal centering */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl bg-gunmetal rounded-sm shadow-luxury p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="font-heading text-2xl font-bold">
              {courseTitle ? `Schedule: ${courseTitle}` : 'Schedule Your Training'}
            </Dialog.Title>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X size={24} />
            </button>
          </div>
          
          {coursePrice && (
            <div className="mb-4 text-tan font-semibold">
              Price: ${coursePrice} • Duration: {courseDuration}
            </div>
          )}
          
          <div className="calendly-container" style={{ height: '680px' }}>
            <InlineWidget
              url={getCalendlyUrl()}
              prefill={{
                customAnswers: {
                  a1: courseId,
                  a2: courseTitle || '',
                  a3: `$${coursePrice}`
                }
              }}
              styles={{ height: '650px', width: '100%' }}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CalendlyModal;