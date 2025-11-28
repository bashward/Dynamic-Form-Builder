import Navbar from "./components/Navbar";
import DynamicForm from "./components/DynamicForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Employee Onboarding</h1>
        <DynamicForm />
      </div>
    </main>
  );
}
