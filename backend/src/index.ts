import express from 'express';
import cors from 'cors';
import { db } from './db';
import { FormSchema, Submission } from './types';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const formSchema: FormSchema = {
    title: "Employee Onboarding",
    description: "Please fill out the following details to complete your onboarding process.",
    fields: [
        {
            id: "fullName",
            type: "text",
            label: "Full Name",
            placeholder: "Enter your full name",
            validation: {
                required: true,
                minLength: 2,
                maxLength: 50
            }
        },
        {
            id: "age",
            type: "number",
            label: "Age",
            placeholder: "Enter your age",
            validation: {
                required: true,
                min: 18,
                max: 100
            }
        },
        {
            id: "department",
            type: "select",
            label: "Department",
            placeholder: "Select your department",
            options: [
                { label: "Engineering", value: "engineering" },
                { label: "Design", value: "design" },
                { label: "Product", value: "product" },
                { label: "Marketing", value: "marketing" }
            ],
            validation: {
                required: true
            }
        },
        {
            id: "skills",
            type: "multi-select",
            label: "Skills",
            placeholder: "Select your skills",
            options: [
                { label: "React", value: "react" },
                { label: "Node.js", value: "nodejs" },
                { label: "TypeScript", value: "typescript" },
                { label: "Python", value: "python" },
                { label: "Go", value: "go" },
                { label: "Java", value: "java" }
            ],
            validation: {
                required: true,
                minSelected: 1
            }
        },
        {
            id: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            placeholder: "Select your date of birth",
            validation: {
                required: true,
                minDate: "1900-01-01"
            }
        },
        {
            id: "bio",
            type: "textarea",
            label: "Bio",
            placeholder: "Tell us a bit about yourself",
            validation: {
                maxLength: 500
            }
        },
        {
            id: "remoteWork",
            type: "switch",
            label: "Remote Work Preference",
            validation: {
                required: false
            }
        }
    ]
};

// GET /form-schema
app.get('/form-schema', (req, res) => {
    res.json(formSchema);
});

// POST /submissions
app.post('/submissions', (req, res) => {
    try {
        const data = req.body;
        const validationErrors: Record<string, string> = {};

        // Dynamic validation based on schema
        for (const field of formSchema.fields) {
            const value = data[field.id];
            const rules = field.validation;

            if (rules?.required) {
                if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                    validationErrors[field.id] = 'Required';
                    continue;
                }
            }

            if (value !== undefined && value !== null && value !== '') {
                if (field.type === 'text' || field.type === 'textarea') {
                    if (rules?.minLength && String(value).length < rules.minLength) {
                        validationErrors[field.id] = `Min length is ${rules.minLength}`;
                    }
                    if (rules?.maxLength && String(value).length > rules.maxLength) {
                        validationErrors[field.id] = `Max length is ${rules.maxLength}`;
                    }
                    if (rules?.pattern && !new RegExp(rules.pattern).test(String(value))) {
                        validationErrors[field.id] = 'Invalid format';
                    }
                }

                if (field.type === 'number') {
                    const numVal = Number(value);
                    if (rules?.min !== undefined && numVal < rules.min) {
                        validationErrors[field.id] = `Min value is ${rules.min}`;
                    }
                    if (rules?.max !== undefined && numVal > rules.max) {
                        validationErrors[field.id] = `Max value is ${rules.max}`;
                    }
                }

                if (field.type === 'date') {
                    if (rules?.minDate && new Date(value) < new Date(rules.minDate)) {
                        validationErrors[field.id] = `Date must be after ${rules.minDate}`;
                    }
                }

                if (field.type === 'multi-select' && Array.isArray(value)) {
                    if (rules?.minSelected && value.length < rules.minSelected) {
                        validationErrors[field.id] = `Select at least ${rules.minSelected}`;
                    }
                    if (rules?.maxSelected && value.length > rules.maxSelected) {
                        validationErrors[field.id] = `Select at most ${rules.maxSelected}`;
                    }
                }
            }
        }

        if (Object.keys(validationErrors).length > 0) {
            res.status(400).json({ success: false, errors: validationErrors });
            return;
        }

        const submission: Submission = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            data: data
        };

        db.addSubmission(submission);

        res.status(201).json({ success: true, ...submission });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// GET /submissions
app.get('/submissions', (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
        const search = (req.query.search as string) || '';

        const result = db.getSubmissions(page, limit, sortBy, sortOrder, search);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// GET /submissions/:id
app.get('/submissions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const submission = db.getSubmission(id);

        if (!submission) {
            res.status(404).json({ success: false, message: 'Submission not found' });
            return;
        }

        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// PUT /submissions/:id
app.put('/submissions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Basic validation (reuse logic if possible, or just check required fields)
        // For update, we might want to validate again. 
        // For simplicity in this enhancement, we assume data is valid or reuse partial validation.
        // Let's just update for now.

        const updated = db.updateSubmission(id, data);

        if (!updated) {
            res.status(404).json({ success: false, message: 'Submission not found' });
            return;
        }

        res.json({ success: true, ...updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// DELETE /submissions/:id
app.delete('/submissions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const deleted = db.deleteSubmission(id);

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Submission not found' });
            return;
        }

        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
