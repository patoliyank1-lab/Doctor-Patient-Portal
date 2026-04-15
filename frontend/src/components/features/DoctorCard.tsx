import Link from "next/link";
import { MapPin, Star, Stethoscope } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { Doctor } from "@/types";

interface DoctorCardProps {
  doctor: Doctor;
  /** Show "Book Appointment" button — visible to patients */
  showBook?: boolean;
}

export function DoctorCard({ doctor, showBook = true }: DoctorCardProps) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar
            src={doctor.profileImage}
            name={doctor.user?.name}
            size="lg"
            className="shrink-0"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {doctor.user?.name}
            </h3>

            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{doctor.specialization}</span>
            </div>

            {doctor.clinicName && (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{doctor.clinicName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-amber-400" aria-hidden="true" />
            <span className="font-medium">
              {doctor.avgRating?.toFixed(1) ?? "—"}
            </span>
            <span className="text-muted-foreground">
              ({doctor.totalReviews ?? 0})
            </span>
          </div>

          <span className="font-semibold text-foreground">
            {formatCurrency(doctor.consultationFee ?? 0)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              / visit
            </span>
          </span>
        </div>

        {/* Experience */}
        <p className="mt-1 text-xs text-muted-foreground">
          {doctor.experience} year{doctor.experience !== 1 ? "s" : ""} experience
        </p>

        {/* Actions */}
        {showBook && (
          <Button asChild className="mt-4 w-full" size="sm">
            <Link href={ROUTES.PATIENT_BOOK(doctor.id)}>
              Book Appointment
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
