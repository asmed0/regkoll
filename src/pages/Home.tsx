import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-4xl font-bold mb-6">{t("Welcome to Gouda Cars")}</h1>
      <p className="text-lg text-gray-600 mb-8">
        {t("Your trusted partner for buying and selling cars")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add your content sections here */}
      </div>
    </div>
  );
};

export default Home;
