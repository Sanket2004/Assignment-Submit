import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import Loader from '../Components/Loader';
import { motion } from 'framer-motion';
import { deleteObject, ref } from 'firebase/storage';


function HomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ assignments: [], userData: null, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (auth.currentUser) {
          const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
          const assignmentsData = [];
          for (const doc of assignmentsSnapshot.docs) {
            const assignment = { id: doc.id, ...doc.data() };
            const creatorData = await getCreatorDetails(assignment.createdBy);
            if (creatorData) {
              assignment.createdByDetails = creatorData;
            } else {
              console.log(`Creator details not found for createdBy: ${assignment.createdBy}`);
            }
            assignmentsData.push(assignment);
          }
          setData(prevData => ({ ...prevData, assignments: assignmentsData }));
        }
      } catch (error) {
        console.error('Error fetching assignments:', error.message);
        toast.error('Error fetching assignments !!');
      } finally {
        setData(prevData => ({ ...prevData, loading: false }));
      }
    };

    const getCreatorDetails = async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        return userDoc.exists() ? userDoc.data() : null;
      } catch (error) {
        console.error('Error fetching creator details:', error.message);
        return null;
      }
    };

    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          setData(prevData => ({ ...prevData, userData: userDoc.exists() ? userDoc.data() : null }));
        } catch (error) {
          console.error('Error fetching user data:', error.message);
        }
      }
    };

    fetchData();
    fetchUserData();

    return () => { };
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }
    try {
      await auth.signOut();
      toast.success('Logout successfully!')
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
      toast.error('Error logging out !!');
    }
  };

const handleDeleteAssignment = async (id) => {
  // Ask the user for confirmation before deleting the assignment
  if (!window.confirm('Are you sure you want to delete this assignment?')) {
    return;
  }

  try {
    // Fetch the assignment from Firestore
    const assignmentDoc = await getDoc(doc(db, 'assignments', id));
    const assignmentData = assignmentDoc.data();

    // Delete the file from Firebase Storage
    const fileRef = ref(storage, assignmentData.fileURL);
    await deleteObject(fileRef);

    // Delete the assignment from Firestore
    await deleteDoc(doc(db, 'assignments', id));

    // Remove the deleted assignment from state
    setData(prevData => ({
      ...prevData,
      assignments: prevData.assignments.filter(assignment => assignment.id !== id)
    }));

    toast.success('Assignment and associated file deleted successfully!');
  } catch (error) {
    console.error('Error deleting assignment and associated file:', error.message);
    toast.error('Error deleting assignment and associated file!');
  }
};

  

  let backgroundImageIndex = 0;

  const backgroundImages = [
    'https://www.gstatic.com/classroom/themes/img_code_thumb.jpg',
    'https://gstatic.com/classroom/themes/img_breakfast_thumb.jpg',
    'https://gstatic.com/classroom/themes/img_backtoschool_thumb.jpg',
    'https://gstatic.com/classroom/themes/Honors_thumb.jpg',
    'https://gstatic.com/classroom/themes/img_bookclub_thumb.jpg',
  ];


  return (
    <>
      <Toaster />
      {data.loading ? (
        <Loader text={"Loading"} />
      ) : (
        <div className='w-full min-h-screen bg-zinc-950 text-white'>
          {data.userData &&
            <div className="mx-auto max-w-[90%] min-h-screen py-36 relative">
              {/* navbar */}
              < nav className='fixed top-8 left-1/2 transform -translate-x-1/2 w-full flex flex-row items-center justify-between bg-zinc-900 max-w-[90%] px-2 py-2 rounded border-2 border-zinc-700 z-50 drop-shadow-2xl'>
                <div className="left">
                  <img src={data.userData.profilePicUrl} className='object-cover h-12 w-12 rounded cursor-pointer' onClick={() => navigate('/profile')} />
                </div>
                <div className="right flex gap-2">
                  <button onClick={handleLogout} className='bg-teal-500 rounded px-4 h-12 text-sm hover:bg-teal-600 transition duration-300'>Logout</button>
                </div>
              </nav>

              {/* Add assignment button */}
              <button onClick={() => navigate('/addAssignment')} className='bg-teal-500 rounded px-4 py-3 fixed bottom-8 right-6 sm:right-20 text-sm z-50 hover:bg-teal-600 transition duration-300'><i className="ri-add-line"></i> Add Assignment</button>

              {/* cards */}
              {data.assignments.length == 0 ?
                <div className="flex flex-col items-center justify-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                  <p className=''>No assignment available</p>
                </div> :
                <div className='grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                  {data.assignments.map(assignment => (
                    backgroundImageIndex = (backgroundImageIndex + 1) % backgroundImages.length,
                    <motion.div
                      whileInView={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ delay: 0, duration: 0.5 }}
                      // whileHover={{scale: 1.02}}
                      key={assignment.id} className=' bg-gradient-to-tl from-teal-900 from-0% to-zinc-800 to-50% h-72 rounded w-full relative truncate border-b-8 border-teal-500'>
                      <div className="relative h-[40%] w-full object-cover cursor-pointer" onClick={() => navigate(`/assignment/${assignment.id}`)}>
                        {/* Use the background image based on the current index */}
                        <img src={backgroundImages[backgroundImageIndex]} className='object-cover h-full w-full object-cover' />
                        {assignment.createdByDetails.profilePicUrl && (
                          <img src={assignment.createdByDetails.profilePicUrl} alt="Profile" className="object-cover absolute w-16 h-16 -bottom-7 right-4 rounded-full hover:scale-110 transition duration-300" />
                        )}
                      </div>
                      <div className="py-8 px-4 cursor-pointer" onClick={() => navigate(`/assignment/${assignment.id}`)}>
                        <h3 className='font-black text-2xl text-teal-500 truncate'>{assignment.title}</h3>
                        <p className='truncate font-semibold'>{assignment.details}</p>
                      </div>
                      <div className="absolute bottom-0 w-full flex justify-between items-center px-4 py-4">
                        <div className="flex flex-col justify-center">
                          <p className='font-bold text-sm'>{assignment.createdByDetails.name || "Anonymous"}</p>
                          <p className='text-xs'>{new Date(assignment.createdByDetails.createdAt.seconds * 1000).toLocaleString()}</p>
                        </div>
                        {assignment.createdBy === auth.currentUser.uid ?
                          <button onClick={() => handleDeleteAssignment(assignment.id)} className='text-sm '><i className="ri-delete-bin-line text-teal-400"></i></button>
                          : ''}
                      </div>
                    </motion.div>
                  ))}
                </div>
              }
              {/* cards end */}


            </div>
          }
        </div >
      )
      }
    </>
  );
}

export default HomePage;
