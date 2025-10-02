interface DashboardCardProps {
  title: string;
  value: string | number;
  actions?: React.ReactNode;
  icon?: string;
}

export const DashboardCard = ({ title, value, actions, icon }: DashboardCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 w-full h-full flex flex-col justify-between">
      <div className="flex items-start space-x-3">
        {icon && <span className="text-2xl flex-shrink-0">{icon}</span>}
        <div className="flex-1 min-w-0">
          <h2
            className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate"
            title={title}
          >
            {title}
          </h2>
          <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap gap-2 mt-3">
          {actions}
        </div>
      )}
    </div>
  );
};
