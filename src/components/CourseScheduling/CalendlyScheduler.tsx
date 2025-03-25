import React from 'react';
import { InlineWidget } from 'react-calendly';

const CalendlyScheduler: React.FC = () => {
  return (
    <div className="calendly-container">
      <InlineWidget
        url="https://calendly.com/your-account/training-session"
        styles={{ height: '650px' }}
      />
    </div>
  );
};

export default CalendlyScheduler;