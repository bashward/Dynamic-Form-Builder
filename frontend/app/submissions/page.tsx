import Navbar from "../components/Navbar";
import SubmissionsTable from "../components/SubmissionsTable";

export default function SubmissionsPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-8">Submissions</h1>
                <SubmissionsTable />
            </div>
        </main>
    );
}
