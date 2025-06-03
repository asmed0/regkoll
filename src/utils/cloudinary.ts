export const CLOUD_NAME = "dnomz0dag";

export const uploadToCloudinary = async (
  file: File,
  licensePlate: string
): Promise<string> => {
  const timestamp = new Date().getTime();
  const uniqueFilename = `${timestamp}_${file.name.replace(/\s+/g, "_")}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "car_submissions");
  formData.append("folder", `submissions/${licensePlate}`);
  formData.append("public_id", uniqueFilename);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudinary error:", data);
      throw new Error(data.error?.message || "Upload failed");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

// Update the gallery URL to point to the correct folder
export const getAlbumUrl = (licensePlate: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/list/submissions/${licensePlate}`;
};
