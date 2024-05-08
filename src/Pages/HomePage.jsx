import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import Loader from '../Components/Loader';
import { motion } from 'framer-motion';


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
        <div className='w-full min-h-screen bg-gray-950 text-white'>
          {data.userData &&
            <div className="mx-auto max-w-[90%] min-h-screen py-36 relative">
              {/* navbar */}
              < nav className='fixed top-8 left-1/2 transform -translate-x-1/2 w-full flex flex-row items-center justify-between bg-gray-900 max-w-[90%] px-2 py-2 rounded border-2 border-gray-700 z-50 drop-shadow-2xl'>
                <div className="left">
                  <img src={data.userData.profilePicUrl} className='h-12 w-12 rounded cursor-pointer' onClick={() => navigate('/profile')} />
                </div>
                <div className="right flex gap-2">
                  <button onClick={handleLogout} className='bg-red-500 rounded px-4 h-12 text-sm hover:bg-red-600 transition duration-300'>Logout</button>
                </div>
              </nav>

              {/* Add assignment button */}
              <button onClick={() => navigate('/addAssignment')} className='bg-red-500 rounded px-4 py-3 fixed bottom-8 right-6 sm:right-20 text-sm z-50 hover:bg-red-600 transition duration-300'><i className="ri-add-line"></i> Add Assignment</button>

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
                      key={assignment.id} className=' bg-gradient-to-tl from-red-900 from-0% to-gray-800 to-50% h-72 rounded w-full relative truncate border-b-8 border-red-500'>
                      <div className="relative h-[40%] w-full object-cover cursor-pointer" onClick={() => navigate(`/assignment/${assignment.id}`)}>
                        {/* Use the background image based on the current index */}
                        <img src={backgroundImages[backgroundImageIndex]} className='h-full w-full object-cover' />
                        {assignment.createdByDetails.profilePicUrl && (
                          <img src={assignment.createdByDetails.profilePicUrl} alt="Profile" className="absolute w-16 h-16 -bottom-7 right-4 rounded-full hover:scale-110 transition duration-300" />
                        )}
                      </div>
                      <div className="py-8 px-4 cursor-pointer" onClick={() => navigate(`/assignment/${assignment.id}`)}>
                        <h3 className='font-black text-2xl text-red-500 truncate'>{assignment.title}</h3>
                        <p className='truncate font-semibold'>{assignment.details}</p>
                      </div>
                      <div className="absolute bottom-0 w-full flex justify-between items-center px-4 py-4">
                        <div className="flex flex-col justify-center">
                          <p className='font-bold text-sm'>{assignment.createdByDetails.name || "Anonymous"}</p>
                          <p className='text-xs'>{new Date(assignment.createdByDetails.createdAt.seconds * 1000).toLocaleString()}</p>
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
          }
        </div >
      )
      }
    </>
  );
}

export default HomePage;
