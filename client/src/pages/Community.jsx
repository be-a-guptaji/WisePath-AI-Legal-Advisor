import React, { useEffect, useState } from "react";
import { dummyPublishedImages } from "../assets/assets";
import Loading from "./Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Community = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { axios } = useAppContext();

  const fetchImages = async () => {
    try {
      const { data } = await axios.get("/api/user/published-images");
      if (data.success) {
        setImages(data.images);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="mx-auto h-full w-full overflow-y-scroll p-6 pt-12 xl:px-12 2xl:px-20">
      <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-purple-100">
        Community Images
      </h2>

      {images.length > 0 ? (
        <div className="flex flex-wrap gap-5 max-sm:justify-center">
          {images.map((item, index) => (
            <a
              key={index}
              href={item.imageUrl}
              target="_blank"
              className="group relative block overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-purple-700"
            >
              <img
                src={item.imageUrl}
                alt=""
                className="h-40 w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 md:h-50 2xl:h-62"
              />
              <p className="absolute right-0 bottom-0 rounded-tl-xl bg-black/50 px-4 py-1 text-xs text-white opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100">
                Created by {item.userName}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-gray-600 dark:text-purple-200">
          No images Available.
        </p>
      )}
    </div>
  );
};

export default Community;
