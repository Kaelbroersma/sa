import React, { useEffect } from 'react';
import { InlineWidget } from 'react-calendly';
import { useNavigate } from 'react-router-dom';

interface AdvancedCalendlyProps {
  userId: string;
  serviceType: string;
}

const AdvancedCalendly: React.FC<AdvancedCalendlyProps> = ({ userId, serviceType }) => {
  const navigate = useNavigate();

  // Listen for Calendly booking events
  useEffect(() => {
    const handleCalendlyEvent = (e: any) => {
      if (e.data.event === 'calendly.event_scheduled') {
        // Extract event details
        const scheduledEvent = e.data.payload;
        
        // Navigate to checkout with event data
        navigate('/checkout', { 
          state: { 
            eventId: scheduledEvent.event.uri,
            eventTime: scheduledEvent.event.start_time,
            eventType: serviceType,
            calendlyEventData: scheduledEvent
          } 
        });
      }
    };
    
    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
  }, [navigate, serviceType]);

  return (
    <div className="calendly-container">
      <InlineWidget
        url="https://calendly.com/your-account/training-session"
        prefill={{
          email: "customer@example.com",
          firstName: "Customer",
          name: "Customer Name",
          customAnswers: {
            a1: userId,
            a2: serviceType
          }
        }}
        styles={{ height: '650px' }}
      />
    </div>
  );
};

export default AdvancedCalendly;