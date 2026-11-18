import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit3,
  X,
  Box,
  Camera
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ItemStatus, InventoryItem } from '../types';

const Inventory: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { inventory, addInventoryItem, updateInventoryItem, maintenance, workOrders } = useData();

  const initialItemId = (location.state as { itemId?: string } | null)?.itemId;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItemId || inventory[0]?.id || ''
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialItemId && inventory.some(i => i.id === initialItemId)) {
      setSelectedItemId(initialItemId);
    }
  }, [initialItemId, inventory]);

  const selectedItem =
    inventory.find(i => i.id === selectedItemId) || inventory[0] || null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Stringing Blocks',
    serialNumber: '',
    rate: 35,
    weeklyRate: 140,
    monthlyRate: 420,
    location: 'Rack A-01',
    status: ItemStatus.AVAILABLE,
    replacementCost: 850,
    manufacturer: 'Tallman Specialty Tools',
    weight: '',
    capacity: '',
    modelNumber: '',
    dimensions: ''
  });

  useEffect(() => {
    if (selectedItem && isEditing) {
      setFormData({
        name: selectedItem.name,
        description: selectedItem.description,
        category: selectedItem.category,
        serialNumber: selectedItem.serialNumber,
        rate: selectedItem.rate,
        weeklyRate: selectedItem.weeklyRate || selectedItem.rate * 4,
        monthlyRate: selectedItem.monthlyRate || selectedItem.rate * 12,
        location: selectedItem.location,
        status: selectedItem.status,
        replacementCost: selectedItem.replacementCost,
        manufacturer: selectedItem.manufacturer || '',
        weight: selectedItem.weight || '',
        capacity: selectedItem.capacity || '',
        modelNumber: selectedItem.modelNumber || '',
        dimensions: selectedItem.dimensions || ''
      });
    } else if (!isModalOpen) {
      resetForm();
    }
  }, [selectedItem, isEditing, isModalOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Stringing Blocks',
      serialNumber: '',
      rate: 35,
      weeklyRate: 140,
      monthlyRate: 420,
      location: 'Rack A-01',
      status: ItemStatus.AVAILABLE,
      replacementCost: 850,
      manufacturer: 'Tallman Specialty Tools',
      weight: '',
      capacity: '',
      modelNumber: '',
      dimensions: ''
    });
  };

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(inventory.map(i => i.category)))],
    [inventory]
  );

  const getStatusText = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.AVAILABLE:
        return <span className="text-[11px] font-semibold text-emerald-700">Available</span>;
      case ItemStatus.RENTED:
        return <span className="text-[11px] font-semibold text-blue-700">On Rent</span>;
      case ItemStatus.INSPECTION:
        return <span className="text-[11px] font-semibold text-indigo-700">In Inspection</span>;
      case ItemStatus.MAINTENANCE:
      case ItemStatus.DAMAGED:
        return <span className="text-[11px] font-semibold text-orange-700">In Repair Shop</span>;
      case ItemStatus.MISSING:
        return <span className="text-[11px] font-semibold text-purple-700">Missing (RO)</span>;
      case ItemStatus.SCRAPPED:
        return <span className="text-[11px] font-semibold text-red-700">Scrapped (BER)</span>;
      default:
        return <span className="text-[11px] font-semibold text-slate-600">{status}</span>;
    }
  };

  const filteredItems = inventory.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.serialNumber.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      (item.modelNumber || '').toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && isEditing) {
      updateInventoryItem(selectedItem.id, formData);
    } else {
      addInventoryItem(formData);
    }
    setIsEditing(false);
    setIsModalOpen(false);
    resetForm();
  };

  const itemMaintenance = maintenance.filter(m => m.itemId === selectedItem?.id);
  const itemWorkOrders = workOrders.filter(w => w.itemId === selectedItem?.id);
  const conditionScore = selectedItem?.conditionScore ?? 96;

  return (
    <div className="space-y-3">
      {/* Header & Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-[15px] font-display font-bold text-slate-900">
              Serialized Tool & Equipment Inventory ({inventory.length} Units)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily/Weekly/Monthly POR rates, ASME/dielectric calibration dates, repair work orders, and BER scrap status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tool, serial, model..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setIsEditing(false);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus size={14} />
              <span>Register Tool</span>
            </button>
          </div>
        </div>

        {/* Status Filter Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {[
            { label: `All Tools (${inventory.length})`, val: 'ALL' },
            { label: 'Available', val: ItemStatus.AVAILABLE },
            { label: 'On Rent', val: ItemStatus.RENTED },
            { label: 'In Inspection', val: ItemStatus.INSPECTION },
            { label: 'In Repair', val: ItemStatus.MAINTENANCE },
            { label: 'Missing (RO)', val: ItemStatus.MISSING },
            { label: 'Scrapped (BER)', val: ItemStatus.SCRAPPED }
          ].map(tab => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ${
                statusFilter === tab.val
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master-Detail Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        <div className="xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-medium text-slate-500">
                    <th className="py-2.5 px-3.5">Tool ID, Name & Serial</th>
                    <th className="py-2.5 px-2.5">Category & Rating</th>
                    <th className="py-2.5 px-2.5">Status</th>
                    <th className="py-2.5 px-2.5 text-right">POR Rates (D / W / M)</th>
                    <th className="py-2.5 px-2.5 text-right">MSRP</th>
                    <th className="py-2.5 px-3.5 text-right">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-3.5">
                          <span className="font-semibold text-slate-900 block">{item.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {item.id} · SN: {item.serialNumber} · Mod: {item.modelNumber || 'STD'}
                          </span>
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="font-medium text-slate-800 block">{item.category}</span>
                          <span className="text-[11px] text-slate-500">
                            {item.capacity || 'Standard WLL'}
                          </span>
                        </td>
                        <td className="py-2 px-2.5">{getStatusText(item.status)}</td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums text-[11px] whitespace-nowrap">
                          <strong className="text-slate-900">${item.rate}/d</strong> · $
                          {item.weeklyRate || item.rate * 4}/w ·{' '}
                          <span className="text-blue-700 font-semibold">
                            ${item.monthlyRate || item.rate * 12}/m
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                          ${item.replacementCost.toLocaleString()}
                        </td>
                        <td className="py-2 px-3.5 text-right text-[11px] text-slate-600">
                          {item.location}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Box size={28} className="text-slate-300 mx-auto mb-1" />
              <h4 className="text-xs font-semibold text-slate-800">No Matching Tools Found</h4>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Light Enterprise Spec & Repair History Inspector */}
        {selectedItem && (
          <div className="xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-semibold text-blue-600 block">
                  {selectedItem.id} · SN: {selectedItem.serialNumber}
                </span>
                <h3 className="text-sm font-display font-bold text-slate-900 mt-0.5">
                  {selectedItem.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedItem.manufacturer || 'Tallman Specialty'} · Model{' '}
                  {selectedItem.modelNumber || 'STD'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => navigate('/scan360', { state: { itemId: selectedItem.id } })}
                  title="Run Scan360 Optical Verification"
                  className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                >
                  <Camera size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setIsModalOpen(true);
                  }}
                  title="Edit Tool Specifications"
                  className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Status & Condition Health</span>
                  {getStatusText(selectedItem.status)}
                </div>

                {/* Condition Health Bar */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Mechanical & Dielectric Score</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {conditionScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        conditionScore >= 85
                          ? 'bg-emerald-500'
                          : conditionScore >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${conditionScore}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {selectedItem.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 font-mono tabular-nums text-[11px]">
                  <div>
                    <span className="text-[10px] font-sans text-slate-500 block">Daily</span>
                    <span className="font-semibold text-slate-900">${selectedItem.rate}/d</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-slate-500 block">Monthly</span>
                    <span className="font-semibold text-blue-600">
                      ${selectedItem.monthlyRate || selectedItem.rate * 12}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-slate-500 block">MSRP</span>
                    <span className="font-semibold text-slate-900">
                      ${selectedItem.replacementCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Location: {selectedItem.location}</span>
                  <span className="font-mono">
                    Cal Due: {selectedItem.nextCalibrationDate || '2027-04-15'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 space-y-2">
                <span className="text-xs font-semibold text-slate-900 block">
                  Repair Work Orders & Service History ({itemMaintenance.length + itemWorkOrders.length})
                </span>
                {itemWorkOrders.map(wo => (
                  <div
                    key={wo.id}
                    className="p-2.5 rounded-lg border border-orange-200 bg-orange-50/50 space-y-1 text-[11px]"
                  >
                    <div className="flex justify-between font-mono font-semibold text-slate-900">
                      <span>
                        {wo.id} · {wo.status}
                      </span>
                      <span>${wo.totalCost.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-700">{wo.defectSummary}</p>
                  </div>
                ))}
                {itemMaintenance.map(rec => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-0.5 text-[11px]"
                  >
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{rec.description}</span>
                      <span className="font-mono">${rec.cost.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500">
                      Tech: {rec.technician} · Date: {rec.date}
                    </p>
                  </div>
                ))}
                {itemMaintenance.length === 0 && itemWorkOrders.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Passed latest ASME/OSHA dielectric & mechanical bench calibration.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Complete Add/Edit Tool Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => {
              setIsModalOpen(false);
              setIsEditing(false);
            }}
          />
          <div className="relative bg-white w-full max-w-xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-display font-bold text-slate-900">
                {isEditing ? 'Modify Tool Specifications' : 'Register New Tool / Equipment'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Tool / Equipment Name *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Stringing Blocks">Stringing Blocks</option>
                    <option value="Hydraulic Tools">Hydraulic Tools</option>
                    <option value="Hoists & Rigging">Hoists & Rigging</option>
                    <option value="Tension & Metering">Tension & Metering</option>
                    <option value="Dielectric & Grounding">Dielectric & Grounding</option>
                    <option value="Underground Pulling">Underground Pulling</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Serial Number *</label>
                  <input
                    required
                    value={formData.serialNumber}
                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Model Number</label>
                  <input
                    value={formData.modelNumber}
                    onChange={e => setFormData({ ...formData, modelNumber: e.target.value })}
                    placeholder="e.g. Y60-A"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Manufacturer</label>
                  <input
                    value={formData.manufacturer}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Capacity / Rating</label>
                  <input
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g. 15,000 lbs WLL"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Warehouse Bin</label>
                  <input
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Daily Rate ($)</label>
                  <input
                    required
                    type="number"
                    value={formData.rate}
                    onChange={e => {
                      const r = Number(e.target.value);
                      setFormData({
                        ...formData,
                        rate: r,
                        weeklyRate: r * 4,
                        monthlyRate: r * 12
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Weekly ($)</label>
                  <input
                    required
                    type="number"
                    value={formData.weeklyRate}
                    onChange={e =>
                      setFormData({ ...formData, weeklyRate: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Monthly ($)</label>
                  <input
                    required
                    type="number"
                    value={formData.monthlyRate}
                    onChange={e =>
                      setFormData({ ...formData, monthlyRate: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">MSRP ($)</label>
                  <input
                    required
                    type="number"
                    value={formData.replacementCost}
                    onChange={e =>
                      setFormData({ ...formData, replacementCost: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Technical Specifications / Notes
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {isEditing ? 'Save Changes' : 'Register Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;