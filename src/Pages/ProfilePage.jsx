import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Loader from '../Components/Loader';
import { motion } from 'framer-motion';

function ProfilePage() {
    // const { uid } = useParams(); // Extract UID from URL params
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const [name, setName] = useState('');
    const [dept, setDept] = useState('');
    const [phone, setPhone] = useState('');
    const [profilePic, setProfilePic] = useState(null); // State for new profile picture
    const [isEditing, setIsEditing] = useState(false); // Add state for editing mode
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [assignments, setAssignments] = useState([]); // State for assignments created by the user
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [data, setData] = useState({ assignments: [], userData: null, loading: true });

    const uid = auth.currentUser ? auth.currentUser.uid : null;

    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                try {
                    // Make a request to fetch user details based on UID
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        setUserDetails(userDoc.data());
                        setName(userDoc.data().name);
                        setDept(userDoc.data().dept)
                        setPhone(userDoc.data().phone)
                    } else {
                        toast.error('User not found');
                        console.log('User not found');
                    }
                } catch (error) {
                    toast.error('Error fetching user data')
                    console.error('Error fetching user data:', error.message);
                } finally {
                    setLoading(false); // Set loading state to false
                }
            }
        };

        const fetchAssignments = async () => {
            try {
                const assignmentsQuery = query(collection(db, 'assignments'), where('createdBy', '==', uid));
                const assignmentsSnapshot = await getDocs(assignmentsQuery);
                const assignmentsData = [];
                for (const doc of assignmentsSnapshot.docs) {
                    const assignment = { id: doc.id, ...doc.data() };
                    assignmentsData.push(assignment);
                }
                setAssignments(assignmentsData);
            } catch (error) {
                console.error('Error fetching assignments:', error.message);
                toast.error('Error fetching assignments !!');
            }
        };

        fetchUserData();
        fetchAssignments();

        // Cleanup function
        return () => {
            // Any cleanup code if needed
        };
    }, [uid]); // Re-run effect when UID changes

    const handleEdit = () => {
        setIsEditing(true); // Set editing mode to true
    };

    const handleUpdateProfile = async () => {
        try {
            const updates = {};

            // Check if the name has changed
            if (name !== userDetails.name) {
                updates.name = name;
            }

            // Check if the department has changed
            if (dept !== userDetails.dept) {
                updates.dept = dept;
            }

            // Check if the phone number has changed
            if (phone !== userDetails.phone) {
                updates.phone = phone;
            }

            // Check if a new profile picture has been uploaded
            if (profilePic) {
                // Create a storage reference to the profile picture location
                const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}/${profilePic.name}`);

                // Upload new profile picture to storage
                await uploadBytes(storageRef, profilePic);

                // Get the URL of the uploaded profile picture
                const profilePicURL = await getDownloadURL(storageRef);

                // Update user document with new profile picture URL
                updates.profilePicUrl = profilePicURL;
            }

            // Update user document only with the fields that have changed
            await updateDoc(doc(db, 'users', uid), updates);

            // Update userDetails state with the updated fields
            setUserDetails(prevUserDetails => ({
                ...prevUserDetails,
                ...updates,
            }));

            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error.message);
            toast.error('Error updating profile');
        } finally {
            setIsEditing(false); // Set editing mode back to false after update
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            toast.success('Logout successfully!')
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error.message);
            toast.error('Error logging out !!');
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

    const handleDeleteAssignment = async (id) => {
        try {
            await deleteDoc(doc(db, 'assignments', id));
            // Remove the deleted assignment from state
            setData(prevData => ({
                ...prevData,
                assignments: prevData.assignments.filter(assignment => assignment.id !== id)
            }));
            toast.success('Assignment deleted successfully!');
        } catch (error) {
            console.error('Error deleting assignment:', error.message);
            toast.error('Error deleting assignment!');
        }
    };


    return (
        <>
            <Toaster position='top-center' />
            {loading ? ( // Render loading state
                <Loader text={"Loading Profile"} />
            ) : (
                <div className='w-full min-h-screen bg-gray-950 text-white'>
                    {/* <i className="ri-arrow-left-s-line bg-red-500 h-10 w-10 flex items-center justify-center flex-0 cursor-pointer rounded mb-8" onClick={() => navigate(-1)}></i> */}
                    <div className="mx-auto max-w-[90%] min-h-screen py-36 relative grid sm:grid-cols-2 gap-8">


                        {/* navbar */}
                        <nav className='fixed top-8 left-1/2 transform -translate-x-1/2 w-full flex flex-row items-center justify-between bg-gray-900 max-w-[90%] px-2 py-2 rounded border-2 border-gray-700 z-50 drop-shadow-2xl'>
                            <div className="left">
                                <img src={userDetails.profilePicUrl} className='object-cover h-12 w-12 rounded cursor-pointer' onClick={() => navigate(`/`)} />
                            </div>
                            <div className="right flex gap-2">
                                <button onClick={handleLogout} className='bg-red-500 rounded px-4 h-12 text-sm'>Logout</button>
                            </div>
                        </nav>


                        <div className="Profile">
                            <div className="flex flex-row justify-between items-center">
                                <motion.h1
                                    whileInView={{ opacity: 1, x: 0 }}
                                    initial={{ opacity: 0, x: -20 }}
                                    transition={{ delay: 0, duration: 0.5 }}
                                    className='text-xl font-black '>My Account</motion.h1>

                                {!isEditing ? <motion.div
                                    whileInView={{ opacity: 1, x: 0 }}
                                    initial={{ opacity: 0, x: -20 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="">
                                    <button onClick={handleEdit} className="text-white rounded text-sm text-white"><i className="ri-pencil-line text-xl"></i></button>
                                </motion.div> : ''}
                            </div>

                            <motion.div
                                whileInView={{ opacity: 1, x: 0 }}
                                initial={{ opacity: 0, x: -20 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="mt-4">
                                {isEditing ? (
                                    <>
                                        {profilePicPreview ? (
                                            <div className='relative w-24 h-24 rounded overflow-hidden'>
                                                <img src={profilePicPreview} alt="Profile Preview" className='h-24 w-24 rounded object-cover' />
                                                <button onClick={() => setProfilePicPreview(null)} className='bg-[#45454594] w-full h-8 absolute bottom-0 left-1/2 transform -translate-x-1/2  text-white'>
                                                    <i className="ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        ) :
                                            <label htmlFor="file-input" className="w-24 h-24 rounded text-sm flex flex-row items-center justify-center bg-gray-900 hover:bg-gray-800 text-white cursor-pointer border-2 border-gray-700">
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
                                    </>
                                ) : (
                                    <img src={userDetails.profilePicUrl} className='object-cover h-24 w-24 rounded bg-slate-800 border-2 border-gray-700' />
                                )}
                            </motion.div>

                            <motion.div
                                whileInView={{ opacity: 1, x: 0 }}
                                initial={{ opacity: 0, x: -20 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                className="mt-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-400">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name || "Anonymous"}
                                    onChange={(e) => setName(e.target.value)}
                                    readOnly={!isEditing} // Set readOnly based on isEditing state
                                    className="mt-1 p-3 block w-full border rounded bg-gray-800 border-gray-600 text-gray-100"
                                />
                            </motion.div>

                            <motion.div
                                whileInView={{ opacity: 1, x: 0 }}
                                initial={{ opacity: 0, x: -20 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="mt-4">
                                <label htmlFor="dept" className="block text-sm font-medium text-gray-400">Department</label>
                                <input
                                    type="text"
                                    id="dept"
                                    value={dept || "Unknown"}
                                    onChange={(e) => setDept(e.target.value)}
                                    readOnly={!isEditing} // Set readOnly based on isEditing state
                                    className="mt-1 p-3 block w-full border rounded bg-gray-800 border-gray-600 text-gray-100"
                                />
                            </motion.div>

                            <motion.div
                                whileInView={{ opacity: 1, x: 0 }}
                                initial={{ opacity: 0, x: -20 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="mt-4">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-400">Phone</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={phone || 0}
                                    onChange={(e) => setPhone(e.target.value)}
                                    readOnly={!isEditing} // Set readOnly based on isEditing state
                                    className="mt-1 p-3 block w-full border rounded bg-gray-800 border-gray-600 text-gray-100"
                                />
                            </motion.div>

                            {isEditing ? (
                                <motion.div
                                    whileInView={{ opacity: 1, x: 0 }}
                                    initial={{ opacity: 0, x: -20 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="mt-4">
                                    <button onClick={handleUpdateProfile} className="bg-red-500 px-4 py-2 rounded text-sm text-white">Save</button>
                                </motion.div>
                            ) : (
                                ''
                            )}
                        </div>


                        <div className="assignments sm:mt-0 mt-8">
                            {/* Render assignments */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <motion.h1
                                    whileInView={{ opacity: 1, x: 0 }}
                                    initial={{ opacity: 0, x: 20 }}
                                    transition={{ delay: 0, duration: 0.5 }}
                                    className='font-black text-xl'>My Assignments</motion.h1>
                                </div>
                                {/* cards */}
                                {assignments.length == 0 ?
                                    <motion.p
                                    whileInView={{ opacity: 1, x: 0 }}
                                    initial={{ opacity: 0, x: 20 }}
                                    transition={{ delay: 0, duration: 0.5 }}
                                    className=''>You haven't created any assignment.</motion.p>
                                    :
                                    <div className='grid sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8'>
                                        {assignments.map(assignment => (
                                            <motion.div
                                                whileInView={{ opacity: 1, x: 0 }}
                                                initial={{ opacity: 0, x: 20 }}
                                                transition={{ delay: 0.2, duration: 0.5 }}
                                                key={assignment.id} className=' bg-gradient-to-tl from-red-900 from-0% to-gray-800 to-50% h-max rounded w-full relative truncate border-b-8 border-red-500'>
                                                <div className="py-4 px-4 cursor-pointer" onClick={() => navigate(`/assignment/${assignment.id}`)}>
                                                    {userDetails.profilePicUrl && (
                                                        <img src={userDetails.profilePicUrl} alt="Profile" className=" w-16 h-16 rounded-full hover:scale-110 transition duration-300" />
                                                    )}
                                                    <h3 className='font-black text-xl text-red-500 truncate'>{assignment.title}</h3>
                                                    <p className='truncate font-semibold'>{assignment.details}</p>
                                                </div>
                                                <div className=" w-full flex justify-between items-center px-4 py-4">
                                                    <div className="flex flex-col justify-center">
                                                        <p className='font-bold text-sm'>{userDetails.name || "Anonymous"}</p>
                                                        <p className='text-xs'>{new Date(assignment.createdAt.seconds * 1000).toLocaleString()}</p>
                                                    </div>
                                                    {assignment.createdBy === auth.currentUser.uid ?
                                                        <button onClick={() => handleDeleteAssignment(assignment.id)} className='text-sm '><i className="ri-delete-bin-line text-red-400"></i></button>
                                                        : ''}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                }
                                {/* cards end */}
                            </div>
                        </div>


                    </div>
                </div>
            )}
        </>
    );
}

export default ProfilePage;
