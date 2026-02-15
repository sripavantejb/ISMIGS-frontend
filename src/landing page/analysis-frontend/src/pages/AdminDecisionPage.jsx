import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'

export default function AdminDecisionPage() {
  const [searchParams] = useSearchParams()
  const result = searchParams.get('result')

  const isApproved = result === 'approved'
  const isRejected = result === 'rejected'

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-xl text-center">
          {isApproved && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-2">Post approved and published</h1>
              <p className="text-primary font-medium">Status: Approved</p>
              <p className="text-muted-foreground text-sm mt-4">
                The post is now live. It will appear as approved in Sector Alerts.
              </p>
            </>
          )}
          {isRejected && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-2">Post cancelled</h1>
              <p className="text-primary font-medium">Status: Rejected</p>
              <p className="text-muted-foreground text-sm mt-4">
                The post was not published. It will show as rejected in Sector Alerts.
              </p>
            </>
          )}
          {!isApproved && !isRejected && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-2">Invalid result</h1>
              <p className="text-muted-foreground text-sm mt-4">
                Use the Approve or Reject link from the confirmation email.
              </p>
            </>
          )}
          <Link
            to="/admin"
            className="inline-block mt-6 px-5 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Admin
          </Link>
        </div>
      </main>
    </div>
  )
}
