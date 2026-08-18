import { useEffect, useState } from 'react';

import api from '../api/axios';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

import {
  FaArrowLeft,
  FaUserEdit,
  FaSignOutAlt,
  FaShieldAlt,
  FaEnvelope,
  FaUser,
  FaCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);

  const [fullname, setFullname] = useState('');

  const [email, setEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);

  // ============================
  // GET CURRENT LOGIN USER
  // ============================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await api.get('/profile');

        console.log('PROFILE:', response.data);

        setUser(response.data);

        setFullname(response.data.fullname || '');

        setEmail(response.data.email || '');
      } catch (err) {
        console.log('PROFILE ERROR:', err);

        if (err.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const updateProfile = async () => {
    try {
      setSaving(true);

      const response = await api.put(`/user/${user.id}`, {
        username: user.username,

        fullname,

        email,

        role: user.role,

        password: newPassword,
      });

      console.log('UPDATE PROFILE:', response.data);

      setUser({
        ...user,
        fullname,
        email,
      });

      setNewPassword('');

      setShowEdit(false);

      alert('Profile berhasil diperbarui');
    } catch (err) {
      console.log('UPDATE ERROR', err);

      alert(err.response?.data || 'Gagal update profile');
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // LOGOUT
  // ============================

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.log(err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('fullname');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('hasLoginBefore');

      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div
        className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-[#f5f5f7]
      "
      >
        <div
          className="
        w-12
        h-12
        rounded-full
        border-4
        border-blue-500
        border-t-transparent
        animate-spin
        "
        />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.fullname
    ?.split(' ')
    .map((x) => x[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className="
min-h-screen
bg-[#f5f5f7]
flex
items-center
justify-center
p-6
overflow-hidden
relative
"
    >
      {/* BACKGROUND BLUR */}

      <div
        className="
absolute
w-[500px]
h-[500px]
bg-blue-300
rounded-full
blur-[130px]
opacity-40
top-[-200px]
left-[-200px]
"
      />

      <div
        className="
absolute
w-[500px]
h-[500px]
bg-purple-300
rounded-full
blur-[130px]
opacity-30
bottom-[-200px]
right-[-200px]
"
      />

      <motion.button
        onClick={() => navigate(-1)}
        whileHover={{
          scale: 1.08,
        }}
        className="
absolute
top-8
left-8
bg-white/70
backdrop-blur-xl
shadow
px-5
py-3
rounded-full
flex
items-center
gap-2
"
      >
        <FaArrowLeft />
        Back
      </motion.button>

      <motion.div
        initial={{
          opacity: 0,
          y: 40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
        }}
        className="
relative
max-w-5xl
w-full
bg-white/80
backdrop-blur-3xl
rounded-[40px]
shadow-[0_40px_100px_rgba(0,0,0,.15)]
p-10
"
      >
        {/* HEADER */}

        <div
          className="
flex
flex-col
md:flex-row
items-center
gap-10
"
        >
          <div
            className="
w-40
h-40
rounded-full
bg-gradient-to-br
from-blue-500
to-indigo-600
flex
items-center
justify-center
text-white
text-6xl
font-bold
shadow-xl
overflow-hidden
"
          >
            {user.avatar ? (
              <img src={user.avatar} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="text-center md:text-left">
            <h1
              className="
text-5xl
font-bold
tracking-tight
text-gray-900
"
            >
              {user.fullname}
            </h1>

            <p
              className="
mt-3
text-gray-500
text-lg
"
            >
              @{user.username}
            </p>

            <div
              className="
mt-5
inline-flex
items-center
gap-3
bg-blue-100
text-blue-700
px-5
py-2
rounded-full
font-semibold
"
            >
              <FaShieldAlt />

              {user.role}
            </div>
          </div>
        </div>

        <hr
          className="
my-10
border-gray-200
"
        />

        <div
          className="
grid
md:grid-cols-3
gap-6
"
        >
          <Card icon={<FaUser />} title="Username" value={user.username} />

          <Card icon={<FaEnvelope />} title="Email" value={user.email || '-'} />

          <Card icon={<FaCircle />} title="Status" value="Online" />
        </div>

        <div
          className="
flex
justify-center
gap-5
mt-12
flex-wrap
"
        >
          <button
            onClick={() => setShowEdit(true)}
            className="
bg-black
text-white
px-8
py-3
rounded-full
flex
items-center
gap-3
hover:scale-105
transition
"
          >
            <FaUserEdit />
            Edit Profile
          </button>

          <button
            onClick={logout}
            className="
bg-red-500
text-white
px-8
py-3
rounded-full
flex
items-center
gap-3
hover:scale-105
transition
"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </motion.div>

      {/* MODAL */}

      {showEdit && (
        <div
          className="
fixed
inset-0
bg-black/40
backdrop-blur-md
flex
items-center
justify-center
z-50
"
        >
          <motion.div
            initial={{
              scale: 0.8,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            className="
bg-white
rounded-[35px]
p-8
w-full
max-w-md
shadow-2xl
"
          >
            <h2
              className="
text-3xl
font-bold
mb-6
"
            >
              Edit Profile
            </h2>

            <div className="space-y-4">
              <input
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Fullname"
                className="
w-full
border
rounded-2xl
px-5
py-3
outline-none
focus:ring-2
focus:ring-blue-500
"
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="
w-full
border
rounded-2xl
px-5
py-3
outline-none
focus:ring-2
focus:ring-blue-500
"
              />

              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password baru (opsional)"
                type="password"
                className="
w-full
border
rounded-2xl
px-5
py-3
outline-none
focus:ring-2
focus:ring-blue-500
"
              />
            </div>

            <div
              className="
flex
justify-end
gap-3
mt-8
"
            >
              <button
                onClick={() => setShowEdit(false)}
                className="
px-6
py-3
rounded-full
bg-gray-200
"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={updateProfile}
                className="
px-6
py-3
rounded-full
bg-blue-600
text-white
disabled:opacity-50
"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, title, value }) {
  return (
    <div
      className="
bg-white
rounded-3xl
p-6
shadow-sm
hover:shadow-xl
transition
"
    >
      <div
        className="
text-blue-600
text-3xl
mb-4
"
      >
        {icon}
      </div>

      <p
        className="
text-gray-400
text-sm
"
      >
        {title}
      </p>

      <h3
        className="
font-bold
text-gray-900
mt-2
break-all
"
      >
        {value}
      </h3>
    </div>
  );
}
