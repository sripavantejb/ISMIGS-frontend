import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Star, Video } from "lucide-react";
import { EXPERTS_MOCK, type Expert } from "../data/expertsMock";

export default function ExpertConsultation() {
  const [bookingExpert, setBookingExpert] = useState<Expert | null>(null);
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-400" />
          Expert consultation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Book 1:1 sessions with agronomists and specialists. Video/audio consultation coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPERTS_MOCK.map((expert) => (
          <Card key={expert.id} className="border-emerald-900/40 bg-card">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base text-foreground">{expert.name}</CardTitle>
                <Badge variant={expert.availability === "Available" ? "default" : "secondary"} className="text-xs">
                  {expert.availability}
                </Badge>
              </div>
              <CardDescription>{expert.specialization}</CardDescription>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {expert.rating}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {expert.bio && <p className="text-xs text-muted-foreground">{expert.bio}</p>}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                  onClick={() => { setBookingExpert(expert); setBookModalOpen(true); }}
                >
                  Book 1:1 session
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-900/40"
                  onClick={() => { setBookingExpert(expert); setConsultModalOpen(true); }}
                >
                  <Video className="h-4 w-4 mr-1" /> Video / audio
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
        <DialogContent className="rounded-xl border-emerald-900/40 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book 1:1 session</DialogTitle>
            <DialogDescription>
              {bookingExpert ? `Request for ${bookingExpert.name} has been noted. Our team will contact you shortly to confirm the session.` : "Booking coming soon."}
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" className="w-full border-emerald-900/40" onClick={() => setBookModalOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={consultModalOpen} onOpenChange={setConsultModalOpen}>
        <DialogContent className="rounded-xl border-emerald-900/40 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Video / audio consultation</DialogTitle>
            <DialogDescription>
              {bookingExpert ? `Consultation with ${bookingExpert.name} (${bookingExpert.specialization}) will be available soon. You can book a 1:1 session in the meantime.` : "Consultation coming soon."}
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" className="w-full border-emerald-900/40" onClick={() => setConsultModalOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
