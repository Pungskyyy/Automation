import { motion } from "framer-motion";


export default function Card({ title, desc }) {
return (
<motion.div
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}
className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md"
>
<h2 className="text-xl font-bold mb-2">{title}</h2>
<p className="text-gray-600">{desc}</p>
</motion.div>
);
}