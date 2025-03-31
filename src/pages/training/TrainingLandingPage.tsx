import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Sun as Gun, Package, Shield, Users, DollarSign } from 'lucide-react';
import Button from '../../components/Button';
import CalendlyModal from '../../components/CourseScheduling/CalendlyModal';

const TrainingLandingPage: React.FC = () => {
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const trainingCourses = [
    {
      id: '1',
      title: "Fundamentals of Marksmanship",
      description: "Master the essential skills of proper stance, grip, sight alignment, and trigger control. Perfect for beginners and those looking to reinforce core techniques.",
      duration: "2 Hours",
      level: "Beginner",
      price: 199,
      equipment: "Available for rent",
      ammo: "40-50 rounds"
    },
    {
      id: '2',
      title: "Long Range Precision",
      description: "Learn the art and science of long-range shooting, including ballistics, wind reading, and precision rifle techniques. Includes practical field exercises.",
      duration: "2 Hours",
      level: "Advanced",
      price: 299,
      equipment: "Available for rent",
      ammo: "60-80 rounds"
    },
    {
      id: '3',
      title: "Custom Rifle Training",
      description: "Specialized training session for Carnimore rifle owners. Get the most out of your custom firearm with personalized instruction.",
      duration: "2 Hours",
      level: "All Levels",
      price: 100,
      equipment: "Bring your Carnimore rifle",
      ammo: "60-80 rounds"
    },
    {
      id: '4',
      title: "Full Auto Experience",
      description: "Experience the thrill of full-auto shooting under expert supervision. Includes safety briefing and hands-on instruction.",
      duration: "1 Hour",
      level: "Intermediate",
      price: 399,
      equipment: "Provided",
      ammo: "Included"
    }
  ];

  const equipmentRentals = [
    {
      name: "Basic Rifle Package",
      description: "Includes rifle, basic optic, and necessary accessories",
      price: 75
    },
    {
      name: "Premium Rifle Package",
      description: "High-end rifle with premium optics and bipod",
      price: 125
    },
    {
      name: "Ammunition Package",
      description: "Standard training ammunition",
      price: 120,
      note: "Flat fee, covers all ammunition needs for the session"
    }
  ];

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsSchedulingOpen(true);
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1595590424283-b8f17842773f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80")',
            filter: 'brightness(0.4)'
          }}
        />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1 
            className="font-heading text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Professional Firearms <span className="text-tan">Training</span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Expert instruction for all skill levels, from fundamentals to advanced techniques
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => {
                const coursesSection = document.getElementById('courses');
                coursesSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Training Courses
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="bg-gunmetal p-8 rounded-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Shield className="text-tan mb-4" size={32} />
              <h3 className="font-heading text-xl font-bold mb-2">Expert Instruction</h3>
              <p className="text-gray-400">
                Learn from certified instructors with extensive real-world experience
              </p>
            </motion.div>

            <motion.div
              className="bg-gunmetal p-8 rounded-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Users className="text-tan mb-4" size={32} />
              <h3 className="font-heading text-xl font-bold mb-2">Small Class Sizes</h3>
              <p className="text-gray-400">
                Individual attention and personalized feedback in every session
              </p>
            </motion.div>

            <motion.div
              className="bg-gunmetal p-8 rounded-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Target className="text-tan mb-4" size={32} />
              <h3 className="font-heading text-xl font-bold mb-2">All Skill Levels</h3>
              <p className="text-gray-400">
                Programs tailored for beginners through advanced shooters
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Training Courses */}
      <section id="courses" className="py-20 bg-gunmetal">
        <div className="container mx-auto px-4">
          <motion.h2
            className="font-heading text-3xl md:text-4xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Training <span className="text-tan">Courses</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trainingCourses.map((course, index) => (
              <motion.div
                key={course.id}
                className="bg-primary p-8 rounded-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-heading text-xl font-bold">{course.title}</h3>
                  <span className="bg-tan text-black px-3 py-1 text-sm font-medium rounded-sm">
                    {course.level}
                  </span>
                </div>
                <p className="text-gray-400 mb-6">{course.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duration:</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Equipment:</span>
                    <span>{course.equipment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ammunition:</span>
                    <span>{course.ammo}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-gunmetal">
                    <span>Price:</span>
                    <span className="text-tan">${course.price}</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleCourseSelect(course.id)}
                >
                  Schedule Training
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Rentals */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <motion.h2
            className="font-heading text-3xl md:text-4xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Equipment <span className="text-tan">Rentals</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {equipmentRentals.map((rental, index) => (
              <motion.div
                key={rental.name}
                className="bg-gunmetal p-8 rounded-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Gun className="text-tan mb-4" size={32} />
                <h3 className="font-heading text-xl font-bold mb-2">{rental.name}</h3>
                <p className="text-gray-400 mb-4">{rental.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gunmetal-light">
                  <span className="text-2xl font-bold text-tan">${rental.price}</span>
                  {rental.note && (
                    <span className="text-sm text-gray-400">{rental.note}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gunmetal">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="font-heading text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to <span className="text-tan">Get Started?</span>
          </motion.h2>
          <motion.p
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Book your training session today and take your shooting skills to the next level
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                const coursesSection = document.getElementById('courses');
                coursesSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Available Courses
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Scheduling Modal */}
      <CalendlyModal
        isOpen={isSchedulingOpen}
        onClose={() => setIsSchedulingOpen(false)}
        courseId={selectedCourseId || ''}
        courseTitle={trainingCourses.find(c => c.id === selectedCourseId)?.title}
        courseDuration={trainingCourses.find(c => c.id === selectedCourseId)?.duration}
        coursePrice={trainingCourses.find(c => c.id === selectedCourseId)?.price}
      />
    </div>
  );
};

export default TrainingLandingPage;