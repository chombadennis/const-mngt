interface DashboardCardProps {
  title: string;
  value: string | number;
  actions?: React.ReactNode;
  icon?: string; // Add this line
}

export const DashboardCard = ({ title, value, actions, icon }: DashboardCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded p-4 w-full sm:w-64 flex items-center space-x-4">
      {icon && <span className="text-3xl">{icon}</span>}
      <div>
        <h2 className="text-gray-500 dark:text-gray-400 text-sm">{title}</h2>
        <p className="text-2xl font-bold">{value}</p>
        {actions}
      </div>
    </div>
  );
};
