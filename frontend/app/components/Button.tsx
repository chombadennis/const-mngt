interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export const Button = ({ children, onClick, type = "button" }: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition"
    >
      {children}
    </button>
  );
};
