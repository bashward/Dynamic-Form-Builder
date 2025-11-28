'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { FormSchema } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Fetch schema
const fetchSchema = async (): Promise<FormSchema> => {
    const res = await fetch('http://localhost:5000/form-schema');
    if (!res.ok) throw new Error('Failed to fetch schema');
    return res.json();
};

interface DynamicFormProps {
    initialData?: Record<string, any>;
    submissionId?: string;
    onSuccess?: () => void;
}

export default function DynamicForm({ initialData, submissionId, onSuccess }: DynamicFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: schema, isLoading, error } = useQuery({
        queryKey: ['form-schema'],
        queryFn: fetchSchema,
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const url = submissionId
                ? `http://localhost:5000/submissions/${submissionId}`
                : 'http://localhost:5000/submissions';

            const method = submissionId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.errors ? JSON.stringify(error.errors) : 'Submission failed');
            }
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: submissionId ? "Updated Successfully" : "Submitted Successfully",
                description: submissionId ? "Your submission has been updated." : "Your form has been submitted.",
            });
            queryClient.invalidateQueries({ queryKey: ['submissions'] });
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/submissions');
            }
        },
        onError: (err) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message,
            });
        }
    });

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="text-red-500 p-10">Error loading form: {error.message}</div>;
    if (!schema) return null;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>{schema.title}</CardTitle>
                    <CardDescription>{schema.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormRenderer
                        schema={schema}
                        mutation={mutation}
                        initialData={initialData}
                        isEdit={!!submissionId}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function FormRenderer({ schema, mutation, initialData, isEdit }: { schema: FormSchema; mutation: any; initialData?: any; isEdit: boolean }) {
    // Preprocess initialData to convert date strings to Date objects
    const processedInitialData = useMemo(() => {
        if (!initialData) return undefined;
        const processed = { ...initialData };
        schema.fields.forEach(field => {
            if (field.type === 'date' && processed[field.id] && typeof processed[field.id] === 'string') {
                processed[field.id] = new Date(processed[field.id]);
            }
        });
        return processed;
    }, [initialData, schema]);

    // Build Zod schema dynamically
    const zodSchema = z.object(
        schema.fields.reduce((acc, field) => {
            let validator: any = z.any();

            if (field.type === 'text' || field.type === 'textarea') {
                validator = z.string();
                if (field.validation?.required) validator = validator.min(1, 'Required');
                if (field.validation?.minLength) validator = validator.min(field.validation.minLength, `Min length is ${field.validation.minLength}`);
                if (field.validation?.maxLength) validator = validator.max(field.validation.maxLength, `Max length is ${field.validation.maxLength}`);
                if (field.validation?.pattern) validator = validator.regex(new RegExp(field.validation.pattern), 'Invalid format');
                if (!field.validation?.required) validator = validator.optional();
            } else if (field.type === 'number') {
                validator = z.coerce.number();
                if (field.validation?.required) validator = validator.min(1, 'Required');

                if (field.validation?.min !== undefined) validator = validator.min(field.validation.min, `Min value is ${field.validation.min}`);
                if (field.validation?.max !== undefined) validator = validator.max(field.validation.max, `Max value is ${field.validation.max}`);
                if (!field.validation?.required) validator = validator.optional();
            } else if (field.type === 'select') {
                validator = z.string();
                if (field.validation?.required) validator = validator.min(1, 'Required');
                if (!field.validation?.required) validator = validator.optional();
            } else if (field.type === 'multi-select') {
                validator = z.array(z.string());
                if (field.validation?.required) validator = validator.min(1, 'Required');
                if (field.validation?.minSelected) validator = validator.min(field.validation.minSelected, `Select at least ${field.validation.minSelected}`);
                if (field.validation?.maxSelected) validator = validator.max(field.validation.maxSelected, `Select at most ${field.validation.maxSelected}`);
                if (!field.validation?.required) validator = validator.optional();
            } else if (field.type === 'date') {
                validator = z.date();
                if (field.validation?.required) validator = validator.refine((date: Date) => !!date, 'Required');
                if (field.validation?.minDate) {
                    const minDate = new Date(field.validation.minDate);
                    validator = validator.min(minDate, `Date must be after ${format(minDate, 'PPP')}`);
                }
                if (!field.validation?.required) validator = validator.optional();
            } else if (field.type === 'switch') {
                validator = z.boolean();
                if (!field.validation?.required) validator = validator.optional();
            }

            acc[field.id] = validator;
            return acc;
        }, {} as any)
    );

    const form = useForm({
        defaultValues: processedInitialData || schema.fields.reduce((acc, field) => {
            if (field.type === 'multi-select') acc[field.id] = [];
            else if (field.type === 'switch') acc[field.id] = false;
            else acc[field.id] = '';
            return acc;
        }, {} as any),
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onChange: zodSchema
        },
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync(value);
        },
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className="space-y-6"
        >
            {schema.fields.map((field) => (
                <form.Field
                    key={field.id}
                    name={field.id}
                    children={(fieldApi) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.id} className="flex gap-1">
                                {field.label}
                                {field.validation?.required && <span className="text-red-500">*</span>}
                            </Label>


                            {field.type === 'text' && (
                                <Input
                                    id={field.id}
                                    placeholder={field.placeholder}
                                    value={fieldApi.state.value}
                                    onChange={(e) => fieldApi.handleChange(e.target.value)}
                                    onBlur={fieldApi.handleBlur}
                                />
                            )}

                            {field.type === 'number' && (
                                <Input
                                    id={field.id}
                                    type="number"
                                    placeholder={field.placeholder}
                                    value={fieldApi.state.value}
                                    onChange={(e) => fieldApi.handleChange(e.target.value)}
                                    onBlur={fieldApi.handleBlur}
                                />
                            )}

                            {field.type === 'textarea' && (
                                <Textarea
                                    id={field.id}
                                    placeholder={field.placeholder}
                                    value={fieldApi.state.value}
                                    onChange={(e) => fieldApi.handleChange(e.target.value)}
                                    onBlur={fieldApi.handleBlur}
                                />
                            )}

                            {field.type === 'select' && (
                                <Select
                                    value={fieldApi.state.value}
                                    onValueChange={fieldApi.handleChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={field.placeholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {field.options?.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {field.type === 'switch' && (
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={field.id}
                                        checked={fieldApi.state.value}
                                        onCheckedChange={fieldApi.handleChange}
                                    />
                                </div>
                            )}

                            {field.type === 'date' && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !fieldApi.state.value && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {fieldApi.state.value ? format(fieldApi.state.value, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={fieldApi.state.value ? new Date(fieldApi.state.value) : undefined}
                                            onSelect={(date) => fieldApi.handleChange(date)}
                                            autoFocus
                                            disabled={(date) => {
                                                if (field.validation?.minDate) {
                                                    return date < new Date(field.validation.minDate);
                                                }
                                                return false;
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}

                            {field.type === 'multi-select' && (
                                <MultiSelect
                                    options={field.options || []}
                                    value={fieldApi.state.value}
                                    onChange={fieldApi.handleChange}
                                    placeholder={field.placeholder}
                                />
                            )}

                            {fieldApi.state.meta.errors ? (
                                <p className="text-sm text-red-500">
                                    {fieldApi.state.meta.errors.map((err: any) => err.message || err).join(', ')}
                                </p>
                            ) : null}
                        </div>
                    )}
                />
            ))}

            <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update' : 'Submit'}
            </Button>

            {mutation.isError && (
                <div className="text-red-500 text-sm mt-2">
                    {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
                </div>
            )}
        </form>
    );
}

function MultiSelect({ options, value, onChange, placeholder }: { options: any[], value: string[], onChange: (val: string[]) => void, placeholder?: string }) {
    const [open, setOpen] = useState(false);

    const handleSelect = (currentValue: string) => {
        const newValue = value.includes(currentValue)
            ? value.filter((v) => v !== currentValue)
            : [...value, currentValue];
        onChange(newValue);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value.length > 0
                        ? `${value.length} selected`
                        : placeholder || "Select..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No option found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
