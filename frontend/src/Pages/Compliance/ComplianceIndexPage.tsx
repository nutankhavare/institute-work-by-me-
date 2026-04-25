import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Download, 
  Plus,
  Eye,
  Pencil,
  Trash2,
  Gavel,
  BookOpen,
  FileText,
  ShieldCheck
} from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import { Loader } from "../../Components/UI/Loader";
import ExportOverlay from "../../Components/UI/ExportOverlay";
import { Pagination } from "../../Components/Table/Pagination";

const ComplianceIndexPage = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [individualExport, setIndividualExport] = useState<any | null>(null);

  const buildBulkPdf = useCallback((opts: { logo?: string; companyName: string; subtitle: string; footerText: string }) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // Branded Header
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 40, "F");

    if (opts.logo) {
      try {
        doc.addImage(opts.logo, "PNG", 14, 8, 24, 24);
      } catch (e) { /* ignore */ }
    }

    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text(opts.companyName || "Institute Compliance Report", opts.logo ? 42 : 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 255);
    doc.text(opts.subtitle || `Generated on ${new Date().toLocaleString()}`, opts.logo ? 42 : 14, 30);

    autoTable(doc, {
      startY: 45,
      head: [["ID", "Document Name", "Authority", "Category", "Status", "Recorded Date"]],
      body: records.map((r) => [
        `#${r.id}`,
        r.document_name,
        r.authority_name,
        r.category,
        r.status,
        new Date(r.date_recorded).toLocaleDateString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Confidential Institutional Record", 14, ph - 10);

    return doc;
  }, [records]);

  const buildIndividualPdf = useCallback((r: any) => (opts: any) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 45, "F");

    if (opts.logo) {
      try { doc.addImage(opts.logo, "PNG", 14, 10, 25, 25); } catch(e){}
    }
    
    const x = opts.logo ? 45 : 20;
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text(opts.companyName || r.document_name, x, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(220, 210, 255);
    doc.text(opts.subtitle || `Authority: ${r.authority_name} · Category: ${r.category}`, x, 32);

    let y = 60;
    const field = (label: string, value: any) => {
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(label, 20, y);
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(String(value || "—"), 75, y);
      y += 10;
    };

    field("Document ID:", `#${r.id}`);
    field("Document Name:", r.document_name);
    field("Authority:", r.authority_name);
    field("Category:", r.category);
    field("Description:", r.description);
    field("Status:", (r.status || "").toUpperCase());
    field("Date Recorded:", new Date(r.date_recorded).toLocaleDateString());

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Regulatory Compliance Record", 20, ph - 15);
    return doc;
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tenantApi.get("/compliance", {
        params: {
          page: pagination.current_page,
          search: search,
          status: statusFilter === "All" ? undefined : statusFilter,
          category: categoryFilter || undefined
        }
      });
      setRecords(response.data.data.data || []);
      setPagination({
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        total: response.data.data.total
      });
    } catch (err) {
      showAlert("Failed to load compliance records", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, search, statusFilter, categoryFilter, showAlert]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await tenantApi.delete(`/compliance/${id}`);
      showAlert("Record deleted successfully", "success");
      fetchRecords();
    } catch (err) {
      showAlert("Failed to delete record", "error");
    }
  };

  const stats = [
    { label: "Total Records", value: pagination.total.toString(), icon: "gavel", bg: "#EDE9FE", ic: "#7C3AED" },
    { label: "Compliant", value: records.filter(r => r.status === "Compliant").length.toString(), icon: "verified", bg: "#DCFCE7", ic: "#059669" },
    { label: "Non-Compliant", value: records.filter(r => r.status === "Non-Compliant").length.toString(), icon: "warning", bg: "#FEE2E2", ic: "#DC2626" },
    { label: "Pending", value: records.filter(r => r.status === "Pending Review").length.toString(), icon: "history", bg: "#FEF3C7", ic: "#D97706" },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Compliance & Laws"
        icon={<Gavel size={18} />}
        breadcrumb="Admin / Compliance & Laws"
        buttonText="Add Record"
        buttonLink="/compliance/create"
      >
        <button className="w-full md:w-auto flex justify-center items-center gap-2 px-5 py-[11px] bg-white text-[#475569] border border-[#e2e8f0] rounded-[10px] text-[12.5px] font-[800] shadow-sm hover:bg-[#f8fafc] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all duration-200" onClick={() => setShowBulkExport(true)}>
          <Download size={16} /> Export PDF
        </button>
      </PageHeader>

      <div className="page-body">
        {/* Mobile Actions Stack */}
        <div className="lg:hidden flex flex-col gap-3 mb-6 px-4">
          <button onClick={() => setShowBulkExport(true)} className="btn btn-secondary w-full justify-center">
            <Download size={18} />
            Export Compliance PDF
          </button>
          <Link to="/compliance/create" className="btn btn-primary w-full justify-center">
            <Plus size={18} />
            Add New Record
          </Link>
        </div>
        {/* Stat Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((s, idx) => (
            <motion.div 
              key={idx}
              className="stat-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="stat-icon" style={{ background: s.bg }}>
                <span className="material-symbols-outlined ms" style={{ color: s.ic }}>{s.icon}</span>
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Guidance Blocks */}
        <div className="white-card">
          <div className="card-title">
            <BookOpen size={18} className="text-primary" />
            RTO Guidelines — Regulatory Information Framework
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
            Official government guidelines and legal compliance requirements for motor driving schools.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: "Registration & Licensing", text: "All schools must maintain a valid license. Licenses must be renewed every 5 years.", color: "var(--primary)" },
              { title: "Instructor Certification", text: "Min. 5 years experience and hold a valid teaching certificate.", color: "var(--primary)" },
              { title: "Dual Control Systems", text: "Every training vehicle must be equipped with dual-clutch and dual-brake systems.", color: "#DC2626" },
              { title: "Vehicle Signage", text: "Vehicles must display a prominent 'L' sign on the front and rear.", color: "#2563EB" },
            ].map((b, i) => (
              <div key={i} className="compliance-block" style={{ borderLeftColor: b.color }}>
                <h4>{b.title}</h4>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden">
        
        {/* Search & Filters */}
        <div className="p-6 border-b border-[#f1f5f9] bg-[#fafbff]/50">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#7c3aed] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by doc name, reg no, category or authority..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[400px]">
              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">All Categories</option>
                <option value="Operational">Operational</option>
                <option value="Legal">Legal</option>
                <option value="Tax">Tax</option>
                <option value="Technical">Technical</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">All Status</option>
                <option value="Compliant">Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
                <option value="Pending Review">Pending Review</option>
              </select>
            </div>

            </div>
          </div>

        <div className="relative">
          <AnimatePresence mode="wait">
             {loading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                 <Loader size={40} />
               </div>
             ) : (
               <table className="data-table">
                  <thead>
                     <tr>
                        <th>ID</th>
                        <th>Document Name</th>
                        <th>Authority</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Recorded Date</th>
                        <th className="text-right px-6">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {records.length === 0 ? (
                       <tr>
                         <td colSpan={7} className="text-center py-20 text-muted">No records found.</td>
                       </tr>
                     ) : (
                       records.map((r, i) => (
                         <tr key={i}>
                            <td className="font-bold text-primary">#{r.id}</td>
                            <td className="font-semibold">{r.document_name}</td>
                            <td>{r.authority_name}</td>
                            <td><span className="badge badge-slate">{r.category}</span></td>
                            <td>
                               <span className={`badge ${
                                 r.status === 'Compliant' ? 'badge-green' : 
                                 r.status === 'Pending Review' ? 'badge-amber' : 'badge-red'
                               }`}>
                                 {r.status}
                               </span>
                            </td>
                            <td className="text-muted font-medium">{new Date(r.date_recorded).toLocaleDateString()}</td>
                            <td className="text-right px-6">
                               <div className="flex justify-end gap-1">
                                  <button onClick={() => setIndividualExport(r)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all" title="Preview Report">
                                     <FileText size={18} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if(confirm("Modify this compliance record?")) {
                                        navigate(`/compliance/edit/${r.id}`);
                                      }
                                    }}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-600 transition-all"
                                    title="Edit Record"
                                  >
                                     <Pencil size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(r.id)}
                                    className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
                                  >
                                     <Trash2 size={18} />
                                  </button>
                               </div>
                            </td>
                         </tr>
                       ))
                     )}
                  </tbody>
               </table>
             )}
           </AnimatePresence>

           {!loading && records.length > 0 && (
             <Pagination
               currentPage={pagination.current_page}
               totalPages={pagination.last_page}
               totalItems={pagination.total}
               onPageChange={(page) => setPagination(prev => ({ ...prev, current_page: page }))}
               itemName="records"
             />
           )}
        </div>
      </div>

      <AnimatePresence>
        {showBulkExport && (
          <ExportOverlay 
            onClose={() => setShowBulkExport(false)} 
            buildPdf={buildBulkPdf}
            title="Export Compliance Report"
            defaultTitle="Institutional Compliance Registry"
            defaultSubtitle={`Record Summary · ${records.length} Documents`}
            fileName="compliance-report.pdf"
          />
        )}
        {individualExport && (
          <ExportOverlay 
            onClose={() => setIndividualExport(null)} 
            buildPdf={buildIndividualPdf(individualExport)}
            title={`Export Compliance Document Profile`}
            defaultTitle={individualExport.document_name}
            defaultSubtitle={`Authority: ${individualExport.authority_name} · Ref: #${individualExport.id}`}
            fileName={`compliance-${individualExport.id}.pdf`}
          />
        )}
      </AnimatePresence>
    </div>
  </div>
);
};

export default ComplianceIndexPage;
