/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaUserEdit, FaSignOutAlt, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
/* eslint-enable no-unused-vars */

export default function ProfilePage() {
    const [user, setUser] = useState({
        fullname: "User",
        role: "Unknown",
        username: "",
    });

    const [showEditForm, setShowEditForm] = useState(false);
    const [formData, setFormData] = useState({
        fullname: "",
        username: "",
        role: "",
    });

    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            setFormData(parsed);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        localStorage.setItem("user", JSON.stringify(formData));
        setUser(formData);
        setShowEditForm(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-400 to-blue-200 flex flex-col items-center py-16 relative overflow-hidden">

            {/* Tombol Back */}
            <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-8 left-8 bg-white/20 text-white border border-white/30 backdrop-blur-md px-4 py-2 rounded-full shadow-lg hover:bg-white/30 transition flex items-center gap-2"
            >
                <FaArrowLeft /> Back
            </motion.button>

            {/* Kartu Profil */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-white shadow-2xl rounded-3xl p-10 w-[90%] max-w-3xl relative"
            >
                <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-30 -z-10"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-blue-400 rounded-full blur-3xl opacity-20 -z-10"></div>

                {/* Header Profil */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <motion.img
                        src="/avatar.png"
                        alt="Profile"
                        className="w-36 h-36 rounded-full border-4 border-blue-500 shadow-lg"
                        whileHover={{ scale: 1.05 }}
                    />
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-extrabold text-gray-800">{user.fullname}</h1>
                        <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full mt-2 font-medium">
                            {user.role}
                        </span>
                        <p className="text-gray-600 mt-2">
                            Username: <span className="font-semibold text-gray-800">{user.username}</span>
                        </p>
                    </div>
                </div>

                <div className="border-t my-6 border-gray-200"></div>

                {/* Info & Aksi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow hover:shadow-lg transition">
                        <h3 className="font-semibold text-blue-700 mb-2">Account Information</h3>
                        <p className="text-gray-600 text-sm">Fullname: <strong>{user.fullname}</strong></p>
                        <p className="text-gray-600 text-sm">Username: <strong>{user.username}</strong></p>
                        <p className="text-gray-600 text-sm">Role: <strong>{user.role}</strong></p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow hover:shadow-lg transition">
                        <h3 className="font-semibold text-blue-700 mb-2">Account Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowEditForm(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                            >
                                <FaUserEdit /> Edit Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
                            >
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Modal Edit Form seperti di CCTVOfficers */}
            {showEditForm && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8"
                    onClick={() => setShowEditForm(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative my-auto animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                            ✏️ Edit Profil
                        </h2>

                        <form onSubmit={handleSaveProfile} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fullname</label>
                                <input
                                    type="text"
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditForm(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
                                >
                                    ❌ Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
                                >
                                    💾 Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="mt-10 text-white/90 text-sm"
            >
                © {new Date().getFullYear()} Smart CCTV System · Powered by HSE PIM.
            </motion.footer>
        </div>
    );
}
