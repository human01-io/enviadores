import React from 'react';

/**
 * ValidationErrors component for displaying Manuable API validation errors
 * 
 * @param {Object} props Component properties
 * @param {Object} props.errors The errors object from Manuable API
 * @param {Function} props.onClose Optional callback when errors are dismissed
 * @param {string} props.className Additional CSS classes
 */
const ValidationErrors = ({ errors, onClose, className = '' }) => {
  // If no errors or empty errors object, don't render anything
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  // Helper function to flatten complex error objects
  const flattenErrors = (errorObj) => {
    const result = [];
    
    // Process each field's errors
    Object.entries(errorObj).forEach(([field, fieldErrors]) => {
      // If fieldErrors is an array of strings, add each one
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(error => {
          result.push(`${formatFieldName(field)}: ${error}`);
        });
      } 
      // If fieldErrors is an object, it's a nested error structure
      else if (typeof fieldErrors === 'object') {
        // Recursively flatten nested errors
        const nestedErrors = flattenErrors(fieldErrors);
        nestedErrors.forEach(error => {
          result.push(`${formatFieldName(field)} ${error}`);
        });
      }
      // If it's a string, add it directly
      else if (typeof fieldErrors === 'string') {
        result.push(`${formatFieldName(field)}: ${fieldErrors}`);
      }
    });
    
    return result;
  };
  
  // Format field names for better display
  const formatFieldName = (field) => {
    // Handle nested fields
    if (field.includes('.')) {
      return field
        .split('.')
        .map(part => formatFieldName(part))
        .join(' > ');
    }
    
    // Convert snake_case or camelCase to Title Case With Spaces
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };
  
  // Get all error messages as a flat array
  const errorMessages = flattenErrors(errors);

  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative ${className}`} role="alert">
      <strong className="font-bold">Error de validación:</strong>
      <span className="block sm:inline"> Por favor corrija los siguientes errores:</span>
      
      <ul className="mt-2 list-disc list-inside text-sm">
        {errorMessages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
      
      {onClose && (
        <button 
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          onClick={onClose}
        >
          <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Cerrar</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default ValidationErrors;