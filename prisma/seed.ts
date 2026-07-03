import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DENTAL_QUESTIONS = [
  { order: 1, questionText: "What do you need help with?", type: "single_choice", options: JSON.stringify(["Tooth Pain / Decay", "Teeth Cleaning", "Implants", "Cosmetic Dentistry", "Braces / Aligners", "Other"]), mapsToIntentWeight: 15 },
  { order: 2, questionText: "How soon do you need this?", type: "single_choice", options: JSON.stringify(["Emergency — need help today", "This week", "This month", "Just exploring options"]), mapsToIntentWeight: 45 },
  { order: 3, questionText: "Would you prefer an in-clinic visit or a teleconsultation?", type: "single_choice", options: JSON.stringify(["In-Clinic", "Teleconsult"]), mapsToIntentWeight: 0 },
  { order: 4, questionText: "Have you visited us before?", type: "single_choice", options: JSON.stringify(["New Patient", "Returning Patient"]), mapsToIntentWeight: 15 },
];

const SKIN_QUESTIONS = [
  { order: 1, questionText: "What brings you in today?", type: "single_choice", options: JSON.stringify(["Acne / Skin Breakouts", "Anti-Aging / Wrinkles", "Laser Hair Removal", "Skin Brightening", "Pigmentation / Dark Spots", "Hair Fall Treatment", "Other"]), mapsToIntentWeight: 15 },
  { order: 2, questionText: "How soon do you need this?", type: "single_choice", options: JSON.stringify(["Urgent — something flared up", "This week", "This month", "Just exploring options"]), mapsToIntentWeight: 45 },
  { order: 3, questionText: "Would you prefer an in-clinic visit or a teleconsultation?", type: "single_choice", options: JSON.stringify(["In-Clinic", "Teleconsult"]), mapsToIntentWeight: 0 },
  { order: 4, questionText: "Have you visited us before?", type: "single_choice", options: JSON.stringify(["New Patient", "Returning Patient"]), mapsToIntentWeight: 15 },
];

const MULTI_SPECIALTY_QUESTIONS = [
  { order: 1, questionText: "Which department are you looking for?", type: "single_choice", options: JSON.stringify(["General Medicine", "Orthopaedics", "Gynaecology", "Paediatrics", "Cardiology", "ENT", "Ophthalmology", "Other"]), mapsToIntentWeight: 15 },
  { order: 2, questionText: "How soon do you need this?", type: "single_choice", options: JSON.stringify(["Emergency — need help today", "This week", "This month", "Just exploring options"]), mapsToIntentWeight: 45 },
  { order: 3, questionText: "Would you prefer an in-clinic visit or a teleconsultation?", type: "single_choice", options: JSON.stringify(["In-Clinic", "Teleconsult"]), mapsToIntentWeight: 0 },
  { order: 4, questionText: "Have you visited us before?", type: "single_choice", options: JSON.stringify(["New Patient", "Returning Patient"]), mapsToIntentWeight: 15 },
  { order: 5, questionText: "Do you have health insurance?", type: "single_choice", options: JSON.stringify(["Yes", "No", "Not sure"]), mapsToIntentWeight: 0 },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
  return d;
}

function computeIntentScore(urgency: string, patientType: string, hasPhone: boolean, hasEmail: boolean): { score: number; label: string } {
  let score = 0;
  if (urgency === "EMERGENCY_TODAY") score += 45;
  else if (urgency === "THIS_WEEK") score += 25;
  else if (urgency === "THIS_MONTH") score += 10;
  score += 15; // specialty match assumed for seeded data
  if (patientType === "Returning") score += 15;
  if (hasPhone && hasEmail) score += 25;
  else if (hasPhone) score += 10;
  score = Math.min(100, score);
  const label = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  return { score, label };
}

const STATUSES = ["NEW", "CONTACTED", "BOOKED", "VISITED", "NO_SHOW", "LOST"];
const DENTAL_CONCERNS = ["Tooth Pain / Decay", "Teeth Cleaning", "Implants", "Cosmetic Dentistry", "Braces / Aligners"];
const SKIN_CONCERNS = ["Acne / Skin Breakouts", "Anti-Aging / Wrinkles", "Laser Hair Removal", "Skin Brightening", "Hair Fall Treatment"];
const MULTI_CONCERNS = ["General Medicine", "Orthopaedics", "Gynaecology", "Paediatrics", "Cardiology"];
const URGENCIES = ["EMERGENCY_TODAY", "THIS_WEEK", "THIS_MONTH", "JUST_EXPLORING"];
const PATIENT_TYPES = ["New", "Returning"];
const VISIT_MODES = ["In-Clinic", "Teleconsult"];

const NAMES = ["Priya Sharma", "Rahul Verma", "Anjali Patel", "Suresh Kumar", "Meena Singh", "Arjun Mehta", "Divya Nair", "Rohan Gupta", "Sunita Joshi", "Vikram Rao", "Kavya Reddy", "Arun Thakur", "Pooja Mishra", "Sanjay Das", "Deepa Iyer"];

async function seedBusiness(data: {
  slug: string;
  name: string;
  ownerName: string;
  email: string;
  password: string;
  city: string;
  specialty: string;
  tier: string;
  brandColor: string;
  avgPatientValue: number;
  questions: typeof DENTAL_QUESTIONS;
  concerns: string[];
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const business = await prisma.business.upsert({
    where: { slug: data.slug },
    update: {},
    create: {
      slug: data.slug,
      name: data.name,
      ownerName: data.ownerName,
      email: data.email,
      passwordHash,
      city: data.city,
      phone: "+91 98765 43210",
      whatsappNumber: "+91 98765 43210",
      alertEmail: data.email,
      specialty: data.specialty,
      tier: data.tier,
      brandColor: data.brandColor,
      avgPatientValue: data.avgPatientValue,
      avgInquiryToBookingRate: 35,
    },
  });

  // seed questions
  await prisma.chatbotQuestion.deleteMany({ where: { businessId: business.id } });
  for (const q of data.questions) {
    await prisma.chatbotQuestion.create({ data: { ...q, businessId: business.id } });
  }

  // seed 15 leads
  const phones = ["9876543210", "9765432109", "9654321098", "9543210987", "9432109876", "9321098765", "9210987654", "9109876543", "9098765432", "8987654321", "8876543210", "8765432109", "8654321098", "8543210987", "8432109876"];
  for (let i = 0; i < 15; i++) {
    const name = NAMES[i];
    const urgency = randomItem(URGENCIES);
    const patientType = randomItem(PATIENT_TYPES);
    const hasEmail = Math.random() > 0.3;
    const { score, label } = computeIntentScore(urgency, patientType, true, hasEmail);
    const createdAt = randomDate(30);
    const lead = await prisma.lead.create({
      data: {
        businessId: business.id,
        name,
        phone: phones[i],
        email: hasEmail ? `${name.split(' ')[0].toLowerCase()}@example.com` : undefined,
        concernType: randomItem(data.concerns),
        urgency,
        visitMode: randomItem(VISIT_MODES),
        patientType,
        hasInsurance: Math.random() > 0.5,
        answers: JSON.stringify({ q1: randomItem(data.concerns), q2: urgency, q3: randomItem(VISIT_MODES), q4: patientType }),
        intentLabel: label,
        intentScore: score,
        status: randomItem(STATUSES),
        source: "Website Chatbot",
        createdAt,
      },
    });
    // add a follow-up sequence for some leads
    if (Math.random() > 0.6) {
      const seq = [1, 3, 7];
      for (const day of seq) {
        const scheduledFor = new Date(createdAt);
        scheduledFor.setDate(scheduledFor.getDate() + day);
        await prisma.followUpSequence.create({
          data: {
            leadId: lead.id,
            day,
            channel: day === 1 ? "whatsapp" : "email",
            templateText: `Hi ${name.split(' ')[0]}, following up about your inquiry at ${data.name}. Would you like to book an appointment?`,
            status: scheduledFor < new Date() ? "sent" : "pending",
            scheduledFor,
            sentAt: scheduledFor < new Date() ? scheduledFor : undefined,
          },
        });
      }
    }
  }

  console.log(`✅  Seeded: ${data.name} (${data.slug}) — login: ${data.email} / ${data.password}`);
  return business;
}

async function main() {
  console.log('🌱 Seeding database...\n');

  await seedBusiness({
    slug: "smile-dental-raipur",
    name: "Smile Dental Clinic",
    ownerName: "Dr. Rajesh Sharma",
    email: "demo@smiledental.com",
    password: "demo1234",
    city: "Raipur",
    specialty: "Dental",
    tier: "PRO",
    brandColor: "#0891b2",
    avgPatientValue: 3500,
    questions: DENTAL_QUESTIONS,
    concerns: DENTAL_CONCERNS,
  });

  await seedBusiness({
    slug: "glowskin-bangalore",
    name: "GlowSkin Aesthetic Clinic",
    ownerName: "Dr. Preethi Nair",
    email: "demo@glowskin.com",
    password: "demo1234",
    city: "Bangalore",
    specialty: "Skin/Cosmetic",
    tier: "GROWTH",
    brandColor: "#9333ea",
    avgPatientValue: 5000,
    questions: SKIN_QUESTIONS,
    concerns: SKIN_CONCERNS,
  });

  await seedBusiness({
    slug: "apollo-multispecialty-nagpur",
    name: "Apollo Multi-Specialty Clinic",
    ownerName: "Dr. Anil Verma",
    email: "demo@apollonagpur.com",
    password: "demo1234",
    city: "Nagpur",
    specialty: "Multi-Specialty",
    tier: "STARTER",
    brandColor: "#059669",
    avgPatientValue: 1500,
    questions: MULTI_SPECIALTY_QUESTIONS,
    concerns: MULTI_CONCERNS,
  });

  console.log('\n✅ Seed complete.\n');
  console.log('Demo logins:');
  console.log('  demo@smiledental.com    / demo1234  →  /demo/smile-dental-raipur');
  console.log('  demo@glowskin.com       / demo1234  →  /demo/glowskin-bangalore');
  console.log('  demo@apollonagpur.com   / demo1234  →  /demo/apollo-multispecialty-nagpur');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
