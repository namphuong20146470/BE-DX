import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Log user activity with better error handling
export const logUserActivity = async (userId, activityType, ipAddress, userAgent, details = null) => {
    try {
        const activity = await prisma.user_activity_log.create({
            data: {
                ma_nguoi_dung: userId,
                activity_type: activityType,
                ip_address: ipAddress,
                user_agent: userAgent,
                details: details
            }
        });
        
        return activity;
    } catch (error) {
        // Special handling for missing table error
        if (error.code === 'P2021') {
            console.error('Error: The user_activity_log table does not exist in the database.');
            console.error('Please run: npx prisma migrate dev --name add_user_activity_log');
        } else {
            console.error('Error logging user activity:', error);
        }
        
        // Don't throw error - logging failures shouldn't disrupt normal operation
        return null;
    }
};
// Get user activity history
function convertToVietnamTime(utcDate) {
    if (!utcDate) return null;
    
    // Vietnam is UTC+7
    const vietnamTime = new Date(new Date(utcDate).getTime() + (7 * 60 * 60 * 1000));
    
    // Format date: YYYY-MM-DD HH:MM:SS
    const year = vietnamTime.getUTCFullYear();
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}
  
  // Update the getUserActivityHistory function to convert timestamps
  export const getUserActivityHistory = async (req, res) => {
      try {
          const { userId } = req.params;
          const { page = 1, limit = 1000000, activityType } = req.query;
          
          const skip = (page - 1) * parseInt(limit);
          
          // Build the where clause
          const where = { ma_nguoi_dung: userId };
          if (activityType) {
              where.activity_type = activityType;
          }
          
          // Get activities with pagination
          const activities = await prisma.user_activity_log.findMany({
              where,
              orderBy: {
                  timestamp: 'desc'
              },
              skip,
              take: parseInt(limit),
              include: {
                  user: {
                      select: {
                          ho_va_ten: true,
                          ten_dang_nhap: true
                      }
                  }
              }
          });
          
          // Convert UTC timestamps to Vietnam time
          const activitiesWithVNTime = activities.map(activity => ({
              ...activity,
              timestamp: convertToVietnamTime(activity.timestamp)
          }));
          
          // Count total activities
          const totalActivities = await prisma.user_activity_log.count({ where });
          
          res.json({
              success: true,
              message: "Lấy lịch sử hoạt động thành công",
              data: activitiesWithVNTime,
              pagination: {
                  page: parseInt(page),
                  limit: parseInt(limit),
                  total: totalActivities,
                  pages: Math.ceil(totalActivities / parseInt(limit))
              }
          });
      } catch (error) {
          console.error('Error:', error);
          res.status(500).json({
              success: false,
              message: "Lỗi khi lấy lịch sử hoạt động",
              error: error.message
          });
      }
  };
  
  // Similarly update the getAllActivityHistory function
  export const getAllActivityHistory = async (req, res) => {
      try {
          const { page = 1, limit = 200000, userId, activityType, startDate, endDate } = req.query;
          
          const skip = (page - 1) * parseInt(limit);
          
          // Build the where clause
          const where = {};
          if (userId) where.ma_nguoi_dung = userId;
          if (activityType) where.activity_type = activityType;
          
          // Add date filtering
          if (startDate || endDate) {
              where.timestamp = {};
              if (startDate) where.timestamp.gte = new Date(startDate);
              if (endDate) where.timestamp.lte = new Date(endDate);
          }
          
          // Get activities with pagination
          const activities = await prisma.user_activity_log.findMany({
              where,
              orderBy: {
                  timestamp: 'desc'
              },
              skip,
              take: parseInt(limit),
              include: {
                  user: {
                      select: {
                          ho_va_ten: true,
                          ten_dang_nhap: true
                      }
                  }
              }
          });
          
          // Convert UTC timestamps to Vietnam time
          const activitiesWithVNTime = activities.map(activity => ({
              ...activity,
              timestamp: convertToVietnamTime(activity.timestamp)
          }));
          
          // Count total activities
          const totalActivities = await prisma.user_activity_log.count({ where });
          
          res.json({
              success: true,
              message: "Lấy lịch sử hoạt động thành công",
              data: activitiesWithVNTime,
              pagination: {
                  page: parseInt(page),
                  limit: parseInt(limit),
                  total: totalActivities,
                  pages: Math.ceil(totalActivities / parseInt(limit))
              }
          });
      } catch (error) {
          console.error('Error:', error);
          res.status(500).json({
              success: false,
              message: "Lỗi khi lấy lịch sử hoạt động",
              error: error.message
          });
      }
  };
  
  // Update the getActivityStats function as well
  export const getActivityStats = async (req, res) => {
      try {
          // Get login statistics for the past 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          // ... other code remains the same
          
          // Get recent activities
          const recentActivities = await prisma.user_activity_log.findMany({
              orderBy: {
                  timestamp: 'desc'
              },
              take: 20,
              include: {
                  user: {
                      select: {
                          ho_va_ten: true
                      }
                  }
              }
          });
          
          // Convert UTC timestamps to Vietnam time
          const recentActivitiesWithVNTime = recentActivities.map(activity => ({
              ...activity,
              timestamp: convertToVietnamTime(activity.timestamp)
          }));
          
          res.json({
              success: true,
              message: "Lấy thống kê hoạt động thành công",
              data: {
                  activityByType,
                  loginByDay,
                  topActiveUsers: topUsers,
                  recentActivities: recentActivitiesWithVNTime
              }
          });
      } catch (error) {
          console.error('Error:', error);
          res.status(500).json({
              success: false,
              message: "Lỗi khi lấy thống kê hoạt động",
              error: error.message
          });
      }
  };