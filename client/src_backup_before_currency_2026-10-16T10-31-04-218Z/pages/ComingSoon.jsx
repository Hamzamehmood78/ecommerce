import { Link } from "react-router-dom";

export default function ComingSoon({ title }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-3 text-muted">
        This page will be built in an upcoming task.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-medium text-white transition hover:bg-primary-dark"
      >
        Back to Home
      </Link>
    </div>
  );
}