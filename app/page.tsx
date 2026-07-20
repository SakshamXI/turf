import Link from "next/link";
import GrievanceContact from "@/components/GrievanceContact";
import Reveal from "@/components/Reveal";

const gallery = [
  { src: "/images/turf-1.jpg", alt: "Full turf under floodlights" },
  { src: "/images/turf-2.jpg", alt: "Turf goalpost close-up" },
  { src: "/images/turf-3.jpg", alt: "Players on the turf at evening" },
  { src: "/images/turf-4.jpg", alt: "Turf seating and entrance" },
  { src: "/images/turf-5.jpg", alt: "Aerial view of the turf" },
  { src: "/images/turf-6.jpg", alt: "Turf at night, lights on" },
];

const rules = [
  "No footwear other than turf shoes or studs approved for artificial turf.",
  "No smoking, alcohol, or any intoxicants on the premises.",
  "No abusive language, physical altercation, or threatening behaviour toward staff or other players.",
  "Vacate the turf promptly when your slot ends — the next booking starts on time.",
  "Report any equipment damage immediately; do not attempt repairs yourself.",
  "Children under 12 must be accompanied by an adult at all times.",
];

export default function HomePage() {
  return (
    <>
      {/* Hero — animates in immediately on load since it's above the fold */}
      <section className="relative bg-pitchDark text-cream overflow-hidden">
        <div className="pitch-lines absolute inset-0" />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full border border-cream/10"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-cream/10"
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-6 py-28 text-center">
          <p className="section-label animate-fade-up">Under the lights, every evening</p>
          <h1 className="font-display font-bold text-4xl md:text-6xl mb-6 animate-fade-up [animation-delay:100ms]">
            Game on Arena
          </h1>
          <p className="text-cream/70 max-w-xl mx-auto mb-10 animate-fade-up [animation-delay:200ms]">
            Book your slot in under a minute. Pick a time, verify your email with a code,
            pay securely, and get your ticket instantly.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-fade-up [animation-delay:300ms]">
            <Link href="/book" className="btn-primary">
              Book a slot
            </Link>
            <a href="#gallery" className="btn-outline">
              See the turf
            </a>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <Reveal>
        <section id="gallery" className="max-w-5xl mx-auto px-6 py-20">
          <p className="section-label">A look around</p>
          <h2 className="font-display font-bold text-3xl text-pitchDark mb-10">The turf</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((img) => (
              <div
                key={img.src}
                className="aspect-[4/3] rounded-lg overflow-hidden bg-line/10 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-pitchDark/40 mt-4">
            Replace the images in <code>/public/images</code> with real photos of your turf.
          </p>
        </section>
      </Reveal>

      {/* Owner */}
      <Reveal>
        <section className="bg-chalk border-y border-line/10">
          <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-[160px_1fr] gap-8 items-start">
            <div className="w-32 h-32 rounded-full bg-line/10 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/owner.jpg" alt="Owner" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="section-label">Who runs this place</p>
              <h2 className="font-display font-bold text-2xl text-pitchDark mb-2">
               Modi Ji
              </h2>
              <p className="text-pitchDark/70 mb-4">
                Angen Ratram Naynen Vaktram
              </p>
              <p className="text-sm text-pitchDark/50">
                Reachable directly at [owner phone / email] for anything the booking flow
                can't handle.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Rules & consequences */}
      <Reveal>
        <section className="max-w-3xl mx-auto px-6 py-20">
          <p className="section-label">Ground rules</p>
          <h2 className="font-display font-bold text-3xl text-pitchDark mb-6">
            Code of conduct
          </h2>
          <ul className="space-y-3 mb-8">
            {rules.map((rule) => (
              <li key={rule} className="flex gap-3 text-pitchDark/80">
                <span className="text-floodlight font-display font-bold mt-0.5">—</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <div className="bg-warningBg border border-warning/20 rounded-lg p-5">
            <p className="font-display font-medium text-warning mb-1">Indiscipline consequences</p>
            <p className="text-warning/90 text-sm">
              Any violation of the above — including damage to equipment, aggressive or abusive
              behaviour, or repeated late vacating of the slot — may result in immediate removal
              from the premises, forfeiture of the booking amount, and denial of future bookings.
              Serious incidents will be reported to local authorities.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Contact & grievances */}
      <Reveal>
        <section id="contact" className="bg-pitch text-cream">
          <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
            <div>
              <p className="section-label">Reach us</p>
              <h2 className="font-display font-bold text-2xl mb-4">Contact us</h2>
              <ul className="space-y-2 text-cream/80 mb-6">
                <li>
                  Phone:{" "}
                  <a href="tel:+911234567890" className="underline hover:text-floodlight">
                    +91 12345 67890
                  </a>
                </li>
                <li>
                  Email:{" "}
                  <a href="mailto:hello@greenfieldturf.com" className="underline hover:text-floodlight">
                    hello@greenfieldturf.com
                  </a>
                </li>
                <li>Address: Udhampur</li>
                <li>Hours: 6:00 AM – 10:00 PM, every day</li>
              </ul>

              <div className="rounded-lg overflow-hidden border border-cream/20">
                <iframe
                  title="Turf location"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    "Udhampur"
                  )}&output=embed`}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  "Udhampur"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cream/60 underline mt-2 inline-block hover:text-floodlight"
              >
                Get directions
              </a>
            </div>
            <div>
              <p className="section-label">Something went wrong?</p>
              <h2 className="font-display font-bold text-2xl mb-4">Your grievances</h2>
              <p className="text-cream/80 mb-4">
                Payment issue, staff behaviour, safety concern, anything else — tell us directly
                and we'll respond personally. This goes straight to the owner, not a call centre.
              </p>
              <GrievanceContact />
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
