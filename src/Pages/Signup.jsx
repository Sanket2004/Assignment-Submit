import React, { useState } from 'react';
import { auth, storage, db } from '../firebase'; // Assuming you've exported the 'auth', 'storage', and 'db' instances from your Firebase setup file
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import toast, { Toaster } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Loader from '../Components/Loader';

const SignUp = () => {
  const [name, setName] = useState('');
  const [dept, setDept] = useState(''); // Default department is CSE
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCPassword] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    //checking if pass and confirmpass are same or not
    if (password !== cpassword) {
      toast.error('Password and Confirm Password should be same.');
      setError('Password and Confirm Password should be same.');
      setLoading(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Validate profile picture
      if (profilePic) {
        if (profilePic.size > 1 * 1024 * 1024) { // Check if image size exceeds 1MB
          // Show error toast
          toast.error('Image size should be less than 1 MB.');
          setError('Image size should be less than 1 MB.');
          return;
        }
        if (!['image/jpeg', 'image/png'].includes(profilePic.type)) { // Check if image type is JPEG or PNG
          // Show error toast
          toast.error('Image should be in JPEG or PNG format.');
          setError('Image should be in JPEG or PNG format.');
          return;
        }
      }

      // Upload profile picture to Firebase Storage
      let profilePicUrl = null;
      if (profilePic) {
        const storageRef = ref(storage, `profile-pics/${user.uid}/${profilePic.name}`);
        await uploadBytes(storageRef, profilePic);
        profilePicUrl = await getDownloadURL(storageRef);
      }

      // Add user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        dept,
        email,
        phone,
        profilePicUrl,
        createdAt: new Date(),
      });

      //making fields empty
      setError(null);
      setProfilePic(null);
      setProfilePicPreview(null);
      setName('');
      setDept('');
      setEmail('');
      setPhone('');
      setPassword('');
      setCPassword('');
      setLoading(false);

      toast.success('Account created successfully');

      // Optional: Redirect the user to another page after successful sign-up
      navigate('/');
    } catch (error) {
      // Show error message
      toast.error(error.message);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleProfilePicChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 1 * 1024 * 1024) { // Check if image size exceeds 1MB
        toast.error('Image size should be less than 1 MB.');
        setError('Image size should be less than 1 MB.');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) { // Check if image type is JPEG or PNG
        toast.error('Image should be in JPEG or PNG format.');
        setError('Image should be in JPEG or PNG format.');
        return;
      }
      setProfilePic(selectedFile);
      setError(null);

      // Show preview of the selected profile picture
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <>
      <Toaster position='top-center' />
      {loading ? ( // Conditionally render Loader component when loading is true
        <Loader text={'Creating Account..'} />
      ) : (
        <div className="mx-auto w-full px-4 py-16 sm:px-6 lg:px-8 min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
          <div className="mx-auto max-w-md text-center">
            <motion.h1
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0, duration: 0.5 }}
              className="text-2xl font-black sm:text-3xl text-teal-500">Get started today!</motion.h1>

            <motion.p
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-4 text-zinc-200">
              This platform is designed to provide a convenient and centralized space for students to help each other in their assignments.
            </motion.p>
          </div>
          <form
            className="mx-auto mb-0 mt-8 max-w-md space-y-4 w-full"
            onSubmit={handleSignUp}>
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className='mx-auto'>
              <label className="sr-only">Profile Picture:</label>

              {profilePicPreview ? (
                <div className='relative w-24 h-24 rounded-full overflow-hidden'>
                  <img src={profilePicPreview} alt="Profile Preview" className='h-24 w-24 rounded-full object-cover' />
                  <button onClick={() => setProfilePicPreview(null)} className='bg-[#45454594] w-full h-8 absolute bottom-0 left-1/2 transform -translate-x-1/2  text-white'>
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              ) :
                // <input className="cursor-pointer bg-zinc-700 text-white placeholder:text-zinc-300 w-24 h-24 rounded-full border border-red-200 p-4 pe-12 text-sm shadow-sm"
                //   type="file"
                //   onChange={handleProfilePicChange}
                //   accept="image/jpeg,image/png" 
                //   required/>
                <label htmlFor="file-input" className="w-24 h-24 rounded-full text-sm flex flex-row items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer border-2 border-zinc-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  <input
                    id="file-input"
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleProfilePicChange}
                    required
                  />
                </label>
              }
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <label className="sr-only">Name:</label>
              <input
                className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                type="text"
                value={name}
                placeholder="Name"
                onChange={(e) => setName(e.target.value)}
                required />
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <label className="sr-only">Department:</label>
              <select
                className="w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm bg-zinc-900 text-white"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                required>
                <option value="" defaultValue={''}>Department</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
                <option value="AIML">AIML</option>
                <option value="IOT">IOT</option>
              </select>
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <label className="sr-only">Email:</label>
              <input
                className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required />
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <label className="sr-only">Phone:</label>
              <input
                className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                required />
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              <label className="sr-only">Password:</label>
              <input
                className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 1.6, duration: 0.5 }}
            >
              <label className="sr-only">Password:</label>
              <input
                className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                placeholder="Confirm Password"
                type="password"
                value={cpassword}
                onChange={(e) => setCPassword(e.target.value)}
                required />
            </motion.div>

            <div className="flex flex-col gap-4 items-center justify-between">
              <motion.button
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 1.8, duration: 0.5 }}
                type="submit"
                className="w-full inline-block rounded-lg bg-teal-500 px-8 py-3 text-sm font-medium text-white"
              >
                Sign Up
              </motion.button>
              <motion.p
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 2, duration: 0.5 }}
                className="text-sm text-zinc-500">
                Have an account ?
                <Link className="hover:underline" to={'/login'}> Sign In</Link>
              </motion.p>


            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default SignUp;
