export type FieldType = 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'textarea' | 'switch';

export interface Option {
    label: string;
    value: string;
}

export interface Validation {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    minDate?: string;
    minSelected?: number;
    maxSelected?: number;
}

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    options?: Option[];
    validation?: Validation;
}

export interface FormSchema {
    title: string;
    description: string;
    fields: FormField[];
}

export interface Submission {
    id: string;
    createdAt: string;
    data: Record<string, any>;
}
