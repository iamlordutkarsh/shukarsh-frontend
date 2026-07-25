/**
 * Placeholder copy until the reviews API lands, at which point this section
 * should read real Review rows instead.
 */
export interface Testimonial {
  quote: string;
  name: string;
  location: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "The press-on set survived a full week of typing, dishes and a wedding. I have never had nails last like that.",
    name: "Aditi",
    location: "Pune",
    rating: 5,
  },
  {
    quote: "Ordered the pastel storage jars for my tiny kitchen and now the counter finally looks calm.",
    name: "Meera",
    location: "Bengaluru",
    rating: 5,
  },
  {
    quote: "Soft, well-stitched and true to size. The knit top has become my default work-from-home uniform.",
    name: "Sanya",
    location: "Delhi",
    rating: 4,
  },
  {
    quote: "Packaging was so pretty I kept the box. Delivery took three days and support actually replied.",
    name: "Ritika",
    location: "Mumbai",
    rating: 5,
  },
];
