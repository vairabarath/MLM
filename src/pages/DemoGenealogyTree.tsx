import React, { useState } from "react";
import {
  User as UserIcon,
  GitBranch,
  PlusSquare,
  MinusSquare,
} from "lucide-react";
import ReferralLink from "../components/common/ReferralLink";

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

// Generate random ethereum-like address
const generateDemoAddress = (seed: number): string => {
  const characters = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += characters.charAt((seed * (i + 1)) % characters.length);
  }
  return address;
};

// Generate demo genealogy tree with 10 levels
const generateDemoTree = (): User => {
  let nodeId = 1;

  const createNode = (level: number): User => {
    const currentId = nodeId++;
    // Generate nodes up to 10 levels, with single child per node for optimization
    let referralCount = 0;
    if (level < 10) {
      referralCount = 1; // 1 referral per user to reach level 10
    }
    // Stop at level 10

    const referrals: User[] = [];
    for (let i = 0; i < referralCount; i++) {
      referrals.push(createNode(level + 1));
    }

    return {
      id: currentId,
      address: generateDemoAddress(currentId),
      referrals: referrals.length > 0 ? referrals : undefined,
    };
  };

  return {
    id: 0,
    address: "0xYourDemoAddress1234567890",
    referrals: [
      createNode(1),
      createNode(1),
      createNode(1),
    ],
  };
};

// TreeNode component for rendering each node in the tree
const TreeNode: React.FC<{ user: User; level: number; isLast: boolean; parentHasButton?: boolean }> = ({
  user,
  level,
  isLast,
  parentHasButton = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Expand only root level by default to avoid performance issues
  const hasChildren = user.referrals && user.referrals.length > 0;

  // Responsive spacing - smaller on mobile
  const getSpacing = () => {
    return {
      levelSpacing: 24, // Reduced from 32px for mobile
      lineOffset: parentHasButton ? 7 : 12,
      horizontalLineWidth: hasChildren ? '14px' : '20px'
    };
  };

  const spacing = getSpacing();

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
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-1 sm:mr-2 p-1 rounded hover:bg-slate-600 transition-colors duration-200 relative z-10"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
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
              {level === 0 ? "You (Demo)" : `ID: ${user.id}`}
            </span>
            {level > 0 && (
              <span className="text-xs font-mono text-gray-300 block truncate">
                ({formatAddress(user.address)})
              </span>
            )}
            {level > 0 && (
              <span className="text-xs text-gray-400 block">
                Level {level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Children nodes */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {user.referrals?.map((child, index) => (
            <TreeNode
              key={child.id}
              user={child}
              level={level + 1}
              isLast={index === user.referrals!.length - 1}
              parentHasButton={hasChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DemoGenealogyTree: React.FC = () => {
  // Generate demo data once
  const [genealogyData] = useState<User>(() => generateDemoTree());

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
        <p className="text-yellow-300 text-sm sm:text-base">
          <span className="font-semibold">Demo Mode:</span> This is a demonstration genealogy tree showing how your referral structure would look with 20 levels of data. This is not real blockchain data.
        </p>
      </div>

      <ReferralLink
        userId={genealogyData?.id || 0}
        userAddress={genealogyData?.address || ""}
        userCode={genealogyData?.id?.toString() || "0"}
      />

      <div className="bg-slate-700 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg text-white overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <GitBranch className="text-blue-400" size={20} />
            <h2 className="text-white text-lg sm:text-xl font-bold">Demo Genealogy Tree</h2>
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
            <TreeNode user={genealogyData} level={0} isLast={true} parentHasButton={false} />
          ) : (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-base sm:text-lg">No data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-700 rounded-xl p-4 sm:p-6 shadow-lg text-white">
        <h3 className="text-lg font-semibold mb-3">About This Demo</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Displays 10 levels of genealogy data (~30 users)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Shows hierarchical structure with mock user IDs and addresses</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Expandable/collapsible nodes for easy navigation</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Level indicators showing depth in the tree</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>First level auto-expands, others collapsed by default for performance</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-400 mr-2">→</span>
            <span>Navigate to <strong>/dashboard/genealogy-tree</strong> to see your real genealogy once you have an active account</span>
          </li>
        </ul>
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

export default DemoGenealogyTree;
