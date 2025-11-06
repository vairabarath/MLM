import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Loader2,
  AlertCircle,
  GitBranch,
  PlusSquare,
  MinusSquare,
} from "lucide-react";
import { useMLMData } from "../hooks/useMLMData";
import ReferralLink from "../components/common/ReferralLink";
import { useWeb3 } from "../hooks/useWeb3";

// Define the User type based on the data structure
interface User {
  id: number;
  address: string;
  referrals?: User[];
}

const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

// TreeNode component for rendering each node in the tree
const TreeNode: React.FC<{
  user: User;
  level: number;
  isLast: boolean;
  parentHasButton?: boolean;
  onLoadChildren: (userAddress: string) => Promise<User[]>;
  updateUserReferrals: (userAddress: string, referrals: User[]) => void;
}> = ({
  user,
  level,
  isLast,
  parentHasButton = false,
  onLoadChildren,
  updateUserReferrals,
}) => {
  // Root level (level 0) starts expanded to show Level 1, others start collapsed
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const [isLoading, setIsLoading] = useState(false);

  // referrals === undefined means not yet fetched
  // referrals === [] means fetched but no children
  // referrals with items means has children
  const hasChildren = user.referrals === undefined || (user.referrals && user.referrals.length > 0);
  const childrenFetched = user.referrals !== undefined;

  // Responsive spacing - smaller on mobile
  const getSpacing = () => {
    return {
      levelSpacing: 24, // Reduced from 32px for mobile
      lineOffset: parentHasButton ? 7 : 12,
      horizontalLineWidth: hasChildren ? '14px' : '20px'
    };
  };

  const spacing = getSpacing();

  const handleExpandToggle = async () => {
    // If collapsing, just toggle
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // If expanding and children not yet fetched, fetch them
    if (!childrenFetched) {
      setIsLoading(true);
      try {
        const children = await onLoadChildren(user.address);
        updateUserReferrals(user.address, children);
      } catch (err) {
        console.error("Failed to load children:", err);
      } finally {
        setIsLoading(false);
      }
    }

    setIsExpanded(true);
  };

  return (
    <div className="relative">
      {/* Tree lines for non-root nodes */}
      {level > 0 && (
        <>
          {/* Vertical line connecting to parent's button */}
          <div
            className={`absolute top-0 w-px bg-gray-400 ${
              isLast ? 'h-6' : 'h-full'
            }`}
            style={{
              left: `${(level - 1) * spacing.levelSpacing + spacing.lineOffset}px`
            }}
          />
          {/* Horizontal line to current node */}
          <div
            className="absolute top-6 h-px bg-gray-400"
            style={{
              left: `${(level - 1) * spacing.levelSpacing + spacing.lineOffset}px`,
              width: spacing.horizontalLineWidth
            }}
          />
        </>
      )}

      <div
        className="flex items-center py-1"
        style={{ paddingLeft: level > 0 ? `${level * spacing.levelSpacing}px` : '0px' }}
      >
        {/* Expand/Collapse button */}
        {hasChildren && (
          <button
            onClick={handleExpandToggle}
            disabled={isLoading}
            className="mr-1 sm:mr-2 p-1 rounded hover:bg-slate-600 transition-colors duration-200 relative z-10 disabled:opacity-50"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isLoading ? (
              <Loader2 size={12} className="text-gray-400 sm:w-4 sm:h-4 animate-spin" />
            ) : isExpanded ? (
              <MinusSquare size={12} className="text-gray-400 sm:w-4 sm:h-4" />
            ) : (
              <PlusSquare size={12} className="text-gray-400 sm:w-4 sm:h-4" />
            )}
          </button>
        )}

        {/* User node - responsive sizing */}
        <div
          className={`flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-lg ${
            level === 0 ? "bg-blue-600" : "bg-slate-800"
          } ${!hasChildren ? "ml-4 sm:ml-6" : ""} shadow-sm border ${
            level === 0 ? "border-blue-500" : "border-slate-600"
          } min-w-0 flex-1 sm:flex-initial`}
        >
          <UserIcon size={14} className="mr-1 sm:mr-2 text-white flex-shrink-0 sm:w-4 sm:h-4" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-white text-sm sm:text-base block truncate">
              {level === 0 ? "You" : `ID: ${user.id}`}
            </span>
            {level > 0 && (
              <span className="text-xs font-mono text-gray-300 block truncate">
                ({formatAddress(user.address)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Children nodes - limit to 10 levels max */}
      {isExpanded && childrenFetched && user.referrals && user.referrals.length > 0 && level < 10 && (
        <div className="relative">
          {user.referrals.map((child, index) => (
            <TreeNode
              key={child.address}
              user={child}
              level={level + 1}
              isLast={index === user.referrals!.length - 1}
              parentHasButton={hasChildren}
              onLoadChildren={onLoadChildren}
              updateUserReferrals={updateUserReferrals}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GenealogyTree: React.FC = () => {
  const { data, loading, error } = useMLMData();
  const web3Context = useWeb3();
  const [genealogyData, setGenealogyData] = useState<User | null>(null);

  // Initialize genealogy data from useMLMData
  useEffect(() => {
    if (data?.genealogy) {
      setGenealogyData(data.genealogy);
    }
  }, [data?.genealogy]);

  // Function to load children for a specific user
  const loadChildren = async (userAddress: string): Promise<User[]> => {
    if (!web3Context?.fetchUserReferrals) {
      throw new Error("Web3 context not available");
    }

    const children = await web3Context.fetchUserReferrals(userAddress);
    return children;
  };

  // Function to update a user's referrals in the tree
  const updateUserReferrals = (userAddress: string, referrals: User[]) => {
    if (!genealogyData) return;

    const updateNode = (node: User): User => {
      if (node.address === userAddress) {
        return { ...node, referrals };
      }

      if (node.referrals && node.referrals.length > 0) {
        return {
          ...node,
          referrals: node.referrals.map(child => updateNode(child))
        };
      }

      return node;
    };

    setGenealogyData(updateNode(genealogyData));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading genealogy tree...</p>
        </div>
      </div>
    );
  }

  if (error || !genealogyData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">
            Error: {error || "No genealogy data available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ReferralLink
        userId={genealogyData?.id || 0}
        userAddress={genealogyData?.address || ""}
        userCode={genealogyData?.id?.toString() || "0"}
      />

      <div className="bg-slate-700 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg text-white overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <GitBranch className="text-blue-400" size={20} />
            <h2 className="text-white text-lg sm:text-xl font-bold">Genealogy Tree</h2>
          </div>
          {genealogyData?.referrals && (
            <div className="flex sm:flex-row gap-6 md:gap-0 sm:items-center sm:space-x-4 text-sm text-gray-300 space-y-1 sm:space-y-0">
              <span>Total: <strong className="text-blue-400">{countTotalUsers(genealogyData)}</strong></span>
              <span>Direct: <strong className="text-green-400">{genealogyData.referrals.length}</strong></span>
            </div>
          )}
        </div>

        {/* Tree container with horizontal scroll on mobile */}
        <div className="min-w-max">
          {genealogyData ? (
            <TreeNode
              user={genealogyData}
              level={0}
              isLast={true}
              parentHasButton={false}
              onLoadChildren={loadChildren}
              updateUserReferrals={updateUserReferrals}
            />
          ) : (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-base sm:text-lg">No referrals yet</p>
              <p className="text-gray-500 text-sm">
                Start referring people to build your genealogy tree
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to count total users in the tree
const countTotalUsers = (user: User): number => {
  let count = 1; // Count the current user
  if (user.referrals) {
    for (const referral of user.referrals) {
      count += countTotalUsers(referral);
    }
  }
  return count;
};

export default GenealogyTree;
