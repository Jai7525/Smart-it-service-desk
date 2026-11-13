import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServiceCatalogItem } from '../types';
import {
  Layers,
  Laptop,
  HardDrive,
  ShieldCheck,
  KeyRound,
  Mail,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  Check,
  Send
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Layers,
  Laptop,
  HardDrive,
  ShieldCheck,
  KeyRound,
  Mail,
  UserPlus,
};

export const ServiceCatalogPage: React.FC = () => {
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Request Modal State
  const [activeItem, setActiveItem] = useState<ServiceCatalogItem | null>(null);
  const [justification, setJustification] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const data = await api.serviceCatalog.list(selectedCategory);
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Software', 'Hardware', 'Access', 'Collaboration', 'Onboarding'];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleOpenRequestModal = (item: ServiceCatalogItem) => {
    setActiveItem(item);
    setJustification('');
    setRequiredDate('');
    const initialForm: Record<string, any> = {};
    item.required_fields.forEach((f) => {
      initialForm[f.name] = f.type === 'select' && f.options ? f.options[0] : '';
    });
    setFormData(initialForm);
    setErrorMsg(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    if (!justification.trim()) {
      setErrorMsg('Business justification is required for auditing.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.serviceRequests.create({
        catalog_item_id: activeItem.id,
        title: activeItem.name,
        category: activeItem.category,
        business_justification: justification,
        required_date: requiredDate || undefined,
        form_data: formData,
      });

      setSuccessMsg(`Service Request ${res.request_number} submitted successfully!`);
      setActiveItem(null);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit service request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Enterprise IT Service Catalogue
          </h1>
          <p className="text-xs text-slate-500">
            Browse and request IT hardware, enterprise software licenses, and cloud privilege access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200/80">
            Guaranteed SLA Fulfillment
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search service catalogue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Loading service catalog items...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg text-slate-400 text-xs">
          No services matched your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const IconComponent = iconMap[item.icon] || Layers;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:border-blue-300 transition-all shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Est. ~{item.estimated_delivery_hours}h SLA
                    </span>
                    <span className="font-semibold text-slate-600">
                      {item.requires_approval ? 'Approval Required' : 'Instant Pre-approval'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenRequestModal(item)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Request Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Request Modal */}
      {activeItem && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitRequest}
            className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Request: {activeItem.name}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {activeItem.category} Desk • Est. ~{activeItem.estimated_delivery_hours}h Fulfillment
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Dynamic Custom Fields */}
            {activeItem.required_fields.map((field) => (
              <div key={field.name} className="space-y-1">
                <label className="block text-xs font-semibold text-slate-800">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}

            {/* Standard Business Justification */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Business Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Explain the operational necessity for this service request..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Date Needed By */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Date Needed By (Optional)
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-3.5 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Service Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

