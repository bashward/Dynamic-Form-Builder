import DynamicForm from "@/app/components/DynamicForm";
import Navbar from "@/app/components/Navbar";

export default async function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await fetch(`http://localhost:5000/submissions/${id}`, { cache: 'no-store' });

    if (!res.ok) {
        return (
            <main className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto py-10 text-center">
                    <h1 className="text-3xl font-bold mb-8">Submission Not Found</h1>
                </div>
            </main>
        );
    }

    const submission = await res.json();

    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-8 text-center">Edit Submission</h1>
                <DynamicForm initialData={submission.data} submissionId={submission.id} />
            </div>
        </main>
    );
}
