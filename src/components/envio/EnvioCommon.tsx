import React, { Fragment, useState } from 'react';
import { Combobox as HeadlessCombobox } from '@headlessui/react';

// Generic search combobox component that can be reused
interface SearchComboboxProps<T> {
  value: T | null;
  onChange: (value: T | null) => void;
  displayValue: (item: T) => string;
  onInputChange: (query: string) => void;
  items: T[];
  renderItem: (item: T, active: boolean, selected: boolean) => React.ReactElement; // Changed from ReactNode to ReactElement
  placeholder?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function SearchCombobox<T>({
  value,
  onChange,
  displayValue,
  onInputChange,
  items,
  renderItem,
  placeholder = 'Buscar...',
  isLoading = false,
  emptyMessage = 'No se encontraron resultados'
}: SearchComboboxProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onInputChange(e.target.value);
  };

  return (
    <HeadlessCombobox value={value} onChange={onChange}>
      <div className="relative">
        <HeadlessCombobox.Input
          onChange={handleInputChange}
          displayValue={displayValue}
          placeholder={isLoading ? 'Buscando...' : placeholder}
          className="w-full p-2 border border-gray-300 rounded-md"
        />

        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {items.length > 0 && (
          <HeadlessCombobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {items.map((item, index) => (
              <HeadlessCombobox.Option key={index} value={item} as={Fragment}>
                {({ active, selected }) => renderItem(item, active, selected)}
              </HeadlessCombobox.Option>
            ))}
          </HeadlessCombobox.Options>
        )}

        {items.length === 0 && searchQuery !== '' && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
            <div className="py-2 px-4 text-sm text-gray-500">
              {emptyMessage}
            </div>
          </div>
        )}
      </div>
    </HeadlessCombobox>
  );
}

// Form section with title and icon
interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: 'blue' | 'green';
}

export function FormSection({ title, icon, children, color = 'blue' }: FormSectionProps) {
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-green-50';
  const borderColor = color === 'blue' ? 'border-blue-100' : 'border-green-100';
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-green-700';

  return (
    <div className={`${bgColor} p-4 rounded-lg shadow-sm border ${borderColor}`}>
      <h3 className={`text-lg font-semibold mb-4 ${textColor} flex items-center`}>
        <span className="mr-2">{icon}</span>
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Form input with label
interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function FormInput({
  label,
  name,
  value,
  onChange,
  required = false,
  type = 'text',
  placeholder = '',
  className = '',
  error
}: FormInputProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`mt-1 block w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Form select with label
interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
  error?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  className = '',
  error
}: FormSelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`mt-1 block w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Form textarea with label
interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function FormTextarea({
  label,
  name,
  value,
  onChange,
  required = false,
  rows = 3,
  placeholder = '',
  className = '',
  error
}: FormTextareaProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className={`mt-1 block w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
      ></textarea>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Common utility functions
export const formatCurrency = (value: number) => {
  return value.toLocaleString('es-MX', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// Common icons
export const Icons = {
  Remitente: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ),
  Destinatario: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  ),
  Servicio: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H14a1 1 0 001-1v-3h2a1 1 0 001-1V8a1 1 0 00-.416-.789l-2-1.666A1 1 0 0014 5.333V4a1 1 0 00-1-1H3zM16 8.8V8l-2-1.667V5H14v3.8l2 .8z" />
    </svg>
  ),
  Check: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  Back: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  ),
  Next: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
  Info: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
};