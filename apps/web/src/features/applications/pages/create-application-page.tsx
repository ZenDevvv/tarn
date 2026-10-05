import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ApplicationForm } from '../components/application-form';

export function CreateApplicationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCompany = searchParams.get('company') || '';

  return (
    <div className="max-w-[760px] mx-auto w-full">
      {/* Header with back link */}
      <div className="mb-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground no-underline transition-colors mb-3"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back to applications</span>
        </Link>
        <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
          Add application
        </h1>
        <p className="text-small text-muted-foreground mt-1">
          Track a new job opportunity, interview stage, or prospective lead.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
        <ApplicationForm
          initialStatus="APPLIED"
          initialCompanyName={initialCompany}
          isModal={false}
          onSuccess={(res) => {
            if (res?.id) {
              navigate(`/applications/${res.id}`);
            } else {
              navigate('/applications');
            }
          }}
          onCancel={() => navigate('/applications')}
        />
      </div>
    </div>
  );
}
