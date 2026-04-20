import { MembershipsLoginForm } from "@/components/admin/MembershipsLoginForm";

export default function MembershipsLoginPage() {
  return (
    <div className="rounded-2xl border-2 border-gold/25 bg-white/90 p-6 shadow-sm sm:p-10">
      <p className="text-xl leading-relaxed text-earth">
        For <strong className="text-deep">committee use only</strong>: there are two PINs — one to{" "}
        <strong className="text-deep">view</strong> the list (search, open each line, download a
        spreadsheet), and one to <strong className="text-deep">edit</strong> (add payments, change
        lines, remove lines). Ask the secretary which PIN you need.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-earth">
        PINs are shared only with people who should use this page. The list is kept on this computer
        until the website is connected to online storage.
      </p>
      <div className="mt-10">
        <MembershipsLoginForm />
      </div>
    </div>
  );
}
