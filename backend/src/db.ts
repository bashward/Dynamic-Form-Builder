import { Submission } from './types';

class Database {
    private submissions: Submission[] = [];

    addSubmission(submission: Submission) {
        this.submissions.push(submission);
    }

    getSubmissions(page: number = 1, limit: number = 10, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc', search: string = '') {
        let filtered = this.submissions;

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(sub =>
                Object.values(sub.data).some(val =>
                    String(val).toLowerCase().includes(searchLower)
                )
            );
        }

        let sorted = [...filtered].sort((a, b) => {
            const valA = a[sortBy as keyof Submission] || a.data[sortBy];
            const valB = b[sortBy as keyof Submission] || b.data[sortBy];

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginated = sorted.slice(startIndex, endIndex);

        return {
            data: paginated,
            meta: {
                total: filtered.length,
                page,
                limit,
                totalPages: Math.ceil(filtered.length / limit)
            }
        };
    }

    updateSubmission(id: string, data: any) {
        const index = this.submissions.findIndex(s => s.id === id);
        if (index !== -1) {
            this.submissions[index] = { ...this.submissions[index], data: { ...this.submissions[index].data, ...data } };
            return this.submissions[index];
        }
        return null;
    }

    deleteSubmission(id: string) {
        const index = this.submissions.findIndex(s => s.id === id);
        if (index !== -1) {
            this.submissions.splice(index, 1);
            return true;
        }
        return false;
    }

    getSubmission(id: string) {
        return this.submissions.find(s => s.id === id);
    }
}

export const db = new Database();
