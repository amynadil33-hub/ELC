import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Invalid email format';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('contact_messages')
        .insert([formData]);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const viberNumber = '9607996772';
  const viberMessage = encodeURIComponent(
    'Hello ELC, I would like to inquire about your programs.'
  );

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-[#1F6F43] py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Contact Us
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Have questions about our programs? We’re here to help.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
          {/* Info */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="font-serif text-xl font-bold mb-6">Get in Touch</h2>

              <Info icon={MapPin} title="Address" a="No:125, Kaneeru Magu" b="Hithadhoo, Addu City" />
              <Info icon={Phone} title="Phone" a="+960 799 6772" b="Viber / WhatsApp" />
              <Info icon={Mail} title="Email" a="elc@everyones.com.mv" b="admin@everyones.com.mv" />
              <Info icon={Clock} title="Office Hours" a="Sat - Thu: 9:00 AM - 9:00 PM" b="Friday: Closed" />
            </div>

            {/* Viber */}
            <div className="bg-[#1F6F43] rounded-xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Quick Contact
              </h3>
              <p className="text-white/90 text-sm mb-4">
                Message us directly on Viber for faster responses.
              </p>
              <a
                href={`viber://chat?number=${viberNumber}&text=${viberMessage}`}
                className="inline-flex items-center bg-white text-[#1F6F43] px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message on Viber
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-8">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-[#1F6F43] mx-auto mb-4" />
                <h2 className="font-serif text-2xl font-bold mb-2">
                  Message Sent!
                </h2>
                <p className="text-gray-600 mb-6">
                  We’ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      subject: '',
                      message: '',
                    });
                  }}
                  className="text-[#1F6F43] font-medium hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input label="Your Name *" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
                <Input label="Email *" name="email" value={formData.email} onChange={handleChange} error={errors.email} />
                <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                <Select label="Subject *" name="subject" value={formData.subject} onChange={handleChange} error={errors.subject} />
                <Textarea label="Message *" name="message" value={formData.message} onChange={handleChange} error={errors.message} />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1F6F43] text-white py-4 rounded-lg font-semibold hover:bg-[#185a36] disabled:opacity-50"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* --- Small UI helpers --- */

function Info({ icon: Icon, title, a, b }: any) {
  return (
    <div className="flex items-start mb-4">
      <Icon className="w-5 h-5 text-[#1F6F43] mr-3 mt-1" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-gray-600">{a}</p>
        <p className="text-sm text-gray-500">{b}</p>
      </div>
    </div>
  );
}

function Input({ label, error, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input {...props} className="w-full px-4 py-3 border rounded-lg" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

function Textarea({ label, error, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea {...props} rows={5} className="w-full px-4 py-3 border rounded-lg" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

function Select({ label, error, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select {...props} className="w-full px-4 py-3 border rounded-lg">
        <option value="">Select</option>
        <option>General Inquiry</option>
        <option>Program Information</option>
        <option>Enrollment Question</option>
        <option>Payment Issue</option>
        <option>Other</option>
      </select>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
