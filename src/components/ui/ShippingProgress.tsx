import React from 'react';
import { MapPin, Package, User, CheckCircle } from 'lucide-react';
import { Separator } from './SeparatorComponent';
import { motion } from 'framer-motion';

interface ShippingProgressProps {
  currentStep: 'address' | 'package' | 'results' | 'customer-data';
  isInternational: boolean;
  isAddressValidated: boolean;
  hasServices: boolean;
  serviceSelected: boolean;
}

export const ShippingProgress: React.FC<ShippingProgressProps> = ({
  currentStep,
  isInternational,
  isAddressValidated,
  hasServices,
  serviceSelected
}) => {
  // Define steps
  const steps = [
    { 
      id: 'address', 
      name: 'Dirección', 
      icon: MapPin, 
      completed: isAddressValidated || currentStep !== 'address',
      active: currentStep === 'address'
    },
    { 
      id: 'package', 
      name: 'Paquete', 
      icon: Package, 
      completed: hasServices || currentStep === 'customer-data',
      active: currentStep === 'package',
      disabled: !isAddressValidated && !isInternational
    },
    { 
      id: 'results', 
      name: 'Tarifas', 
      icon: CheckCircle, 
      completed: serviceSelected || currentStep === 'customer-data',
      active: currentStep === 'results',
      disabled: !hasServices
    },
    { 
      id: 'customer-data', 
      name: 'Cliente', 
      icon: User, 
      completed: currentStep === 'customer-data',
      active: currentStep === 'customer-data',
      disabled: !serviceSelected
    }
  ];

  return (
    <div className="flex justify-between items-center py-4 px-2">
      {steps.map((step, index) => {
        // Calculate step status
        const isCurrent = step.active;
        const isCompleted = step.completed;
        const isDisabled = step.disabled;
        
        // Get appropriate colors based on status
        const circleColor = isCompleted 
          ? 'bg-green-500 text-white border-green-500' 
          : isCurrent 
            ? 'bg-blue-500 text-white border-blue-500' 
            : 'bg-gray-100 text-gray-400 border-gray-300';
        
        const textColor = isCompleted 
          ? 'text-green-600' 
          : isCurrent 
            ? 'text-blue-600' 
            : 'text-gray-400';
        
        const nameDisplay = index < steps.length - 1 ? (
          <>
            {step.name}
            <Separator orientation="vertical" className="h-6 mx-2 bg-gray-200" />
          </>
        ) : step.name;
        
        // Set animation for current step
        const StepIcon = step.icon;
        
        return (
          <div 
            key={step.id} 
            className={`flex items-center ${isDisabled ? 'opacity-50' : ''}`}
          >
            <div className="flex flex-col items-center">
              <motion.div 
                className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${circleColor}`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <StepIcon className="w-4 h-4" />
              </motion.div>
              <span className={`text-xs mt-1 font-medium ${textColor}`}>
                {nameDisplay}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};