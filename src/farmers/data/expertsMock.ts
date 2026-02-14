/**
 * Mock list of experts for 1:1 consultation.
 */

export interface Expert {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  availability: "Available" | "Busy" | "Offline";
  bio?: string;
}

export const EXPERTS_MOCK: Expert[] = [
  { id: "1", name: "Dr. Rajesh Kumar", specialization: "Cotton & pest management", rating: 4.8, availability: "Available", bio: "15+ years in cotton and integrated pest management." },
  { id: "2", name: "Dr. Priya Sharma", specialization: "Rice & wheat agronomy", rating: 4.9, availability: "Available", bio: "State agriculture university; rice and wheat cultivation." },
  { id: "3", name: "Suresh Reddy", specialization: "Drip irrigation & water", rating: 4.6, availability: "Busy", bio: "Irrigation and water-use efficiency specialist." },
  { id: "4", name: "Dr. Anjali Verma", specialization: "Soil health & fertilizers", rating: 4.7, availability: "Available", bio: "Soil testing and nutrient management." },
  { id: "5", name: "Kiran Singh", specialization: "Pesticides & crop protection", rating: 4.5, availability: "Available", bio: "Safe use of pesticides and IPM." },
];
