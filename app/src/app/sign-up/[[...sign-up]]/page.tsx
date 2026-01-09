import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-blue-600 hover:bg-blue-500 text-sm normal-case",
            card: "bg-slate-800 border border-slate-700",
            headerTitle: "text-white",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton:
              "bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
            formFieldLabel: "text-slate-300",
            formFieldInput:
              "bg-slate-700 border-slate-600 text-white placeholder:text-slate-500",
            footerActionLink: "text-blue-400 hover:text-blue-300",
          },
        }}
      />
    </div>
  );
}
