import React from 'react';
import { motion } from 'framer-motion';
import { Scale, FileText, Shield, AlertTriangle, BadgeDollarSign } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="mb-16">
          <motion.h1 
            className="font-heading text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Terms of <span className="text-tan">Service</span>
          </motion.h1>
          <motion.div 
            className="w-24 h-0.5 bg-tan mb-8"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          ></motion.div>
          <motion.p
            className="text-xl text-gray-300 max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Please read these terms carefully before using our services. By using our website and services, you agree to these terms.
          </motion.p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center mb-6">
              <FileText className="text-tan mr-3" size={24} />
              <h2 className="font-heading text-2xl font-bold">General Terms</h2>
            </div>
            <div className="bg-gunmetal p-8 rounded-sm shadow-luxury">
              <div className="space-y-4 text-gray-300">
                <p>
                  By accessing and placing an order with Carnimore, you confirm that you are in agreement with and bound by the terms and conditions contained herein.
                </p>
                <p>
                  These terms apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <Scale className="text-tan mr-3" size={24} />
              <h2 className="font-heading text-2xl font-bold">Legal Compliance</h2>
            </div>
            <div className="bg-gunmetal p-8 rounded-sm shadow-luxury">
              <div className="space-y-4 text-gray-300">
                <p>You agree to comply with all applicable laws and regulations regarding:</p>
                <ul className="space-y-2">
                  <li>• Federal firearms regulations</li>
                  <li>• State and local firearms laws</li>
                  <li>• Age restrictions and verification</li>
                  <li>• Licensing requirements</li>
                  <li>• Transfer and shipping regulations</li>
                </ul>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <BadgeDollarSign className="text-tan mr-3" size={24} />
              <h2 className="font-heading text-2xl font-bold">Terms of Sale</h2>
            </div>
            <div className="bg-gunmetal p-8 rounded-sm shadow-luxury">
              <div className="space-y-6 text-gray-300">
                <p>By purchasing products from Carnimore, you agree to the following Terms of Sale. Please read them carefully before making a purchase.</p>
                
                <div>
                  <h3 className="text-tan text-lg font-heading mb-2">Payment and Processing Fees</h3>
                  <ul className="space-y-2">
                    <li>• All online purchases are subject to a 3% processing fee</li>
                    <li>• The processing fee will be applied at checkout in addition to the price of the product</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-tan text-lg font-heading mb-2">Legality of Purchase</h3>
                  <ul className="space-y-2">
                    <li>• You must comply with all applicable federal, state, and local laws regarding the purchase and ownership of firearms</li>
                    <li>• If it is discovered that your purchase violates any legal regulations, Carnimore reserves the right to confiscate and retain the product</li>
                    <li>• It is your responsibility to ensure that you are legally allowed to purchase and own the firearm in your jurisdiction</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-tan text-lg font-heading mb-2">No Refunds or Returns</h3>
                  <ul className="space-y-2">
                    <li>• All sales are final, and refunds are not allowed under any circumstances</li>
                    <li>• Once a purchase is made, no returns, exchanges, or refunds will be processed</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-tan text-lg font-heading mb-2">Shipping and Delivery</h3>
                  <ul className="space-y-2">
                    <li>• Shipping costs and delivery times will be calculated at checkout</li>
                    <li>• Carnimore is not responsible for delays caused by shipping carriers or incorrect address information provided by the customer</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-tan text-lg font-heading mb-2">Age Verification</h3>
                  <ul className="space-y-2">
                    <li>• You must be at least 18 years of age to purchase firearms from Carnimore, subject to the laws of your governing state</li>
                    <li>• Age verification may be required before shipment of any firearms</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-tan text-lg font-heading mb-2">Customer Responsibilities</h3>
                  <ul className="space-y-2">
                    <li>• It is your responsibility to inspect your purchased products upon receipt and report any discrepancies or issues within 7 days of receiving your order</li>
                    <li>• You agree to follow all legal and safety guidelines for owning and operating firearms</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-tan text-lg font-heading mb-2">Modification of Terms</h3>
                  <ul className="space-y-2">
                    <li>• Carnimore reserves the right to update or modify these Terms of Sale at any time</li>
                    <li>• Changes will be posted on the website, and the updated terms will apply to future purchases</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-tan text-lg font-heading mb-2">Governing Law</h3>
                  <ul className="space-y-2">
                    <li>• These Terms of Sale shall be governed by the laws of the jurisdiction in which Carnimore operates</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center mb-6">
              <Shield className="text-tan mr-3" size={24} />
              <h2 className="font-heading text-2xl font-bold">Product Terms</h2>
            </div>
            <div className="bg-gunmetal p-8 rounded-sm shadow-luxury">
              <div className="space-y-4 text-gray-300">
                <h3 className="font-bold text-lg mb-3">Custom Orders</h3>
                <ul className="space-y-2">
                  <li>• All sales are final on custom orders</li>
                  <li>• Production times are estimates and subject to change</li>
                  <li>• Modifications after order placement may incur additional charges</li>
                  <li>• Cancellations may be subject to restocking fees</li>
                </ul>

                <h3 className="font-bold text-lg mt-6 mb-3">Warranties</h3>
                <ul className="space-y-2">
                  <li>• Limited warranty on workmanship</li>
                  <li>• Manufacturer warranties apply where applicable</li>
                  <li>• Modifications may void manufacturer warranties</li>
                </ul>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="flex items-center mb-6">
              <AlertTriangle className="text-tan mr-3" size={24} />
              <h2 className="font-heading text-2xl font-bold">Limitations of Liability</h2>
            </div>
            <div className="bg-gunmetal p-8 rounded-sm shadow-luxury">
              <div className="space-y-4 text-gray-300">
                <p>
                  Carnimore shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
                <p>
                  We reserve the right to:
                </p>
                <ul className="space-y-2">
                  <li>• Modify or withdraw services</li>
                  <li>• Refuse service to anyone</li>
                  <li>• Modify these terms at any time</li>
                </ul>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Contact Information */}
        <motion.div
          className="mt-12 bg-gunmetal p-8 rounded-sm shadow-luxury text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="font-heading text-2xl font-bold mb-4">Questions About Our Terms?</h2>
          <p className="text-gray-300 mb-4">
            If you have any questions about our terms of service, please contact our legal department:
          </p>
          <p className="text-tan">
            legal@carnimore.com
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;