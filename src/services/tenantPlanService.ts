import { HouseUnit, RegisteredDevice, SecurityCompany } from '../types';

export const MAX_HOUSES_PER_COMPANY = 50;
export const MAX_DEVICES_PER_HOUSE = 2;

export interface PlanValidationResult {
  allowed: boolean;
  success: boolean;
  reason?: string;
  message?: string;
}

export class TenantPlanService {
  /**
   * Enforces that a security company cannot exceed 50 houses.
   */
  static validateAddHouse(companyHouses: HouseUnit[] = []): PlanValidationResult {
    const list = companyHouses || [];
    if (list.length >= MAX_HOUSES_PER_COMPANY) {
      const msg = `Plan Limit Exceeded: Security company cannot exceed ${MAX_HOUSES_PER_COMPANY} connected houses. Plan limit of 50 houses reached.`;
      return {
        allowed: false,
        success: false,
        reason: msg,
        message: msg,
      };
    }
    return { allowed: true, success: true };
  }

  static canAddHouse(companyHouses: HouseUnit[] = []): PlanValidationResult {
    return this.validateAddHouse(companyHouses);
  }

  /**
   * Enforces that a house cannot exceed 2 registered devices.
   */
  static validateAddDevice(house?: HouseUnit): PlanValidationResult {
    if (!house) {
      return { allowed: false, success: false, reason: 'Invalid house unit', message: 'Invalid house unit' };
    }
    const devices = house.registeredDevices || [];
    if (devices.length >= MAX_DEVICES_PER_HOUSE) {
      const msg = `Device Limit Exceeded: ${house.houseNumber || 'House'} already has the maximum ${MAX_DEVICES_PER_HOUSE} active devices allocated (Phone/Guard/Keyfob). Remove an existing device to register a new one.`;
      return {
        allowed: false,
        success: false,
        reason: msg,
        message: msg,
      };
    }
    return { allowed: true, success: true };
  }

  static canAddDeviceToHouse(house?: HouseUnit): PlanValidationResult {
    return this.validateAddDevice(house);
  }

  /**
   * Get quota metrics for a company
   */
  static getCompanyPlanMetrics(company?: SecurityCompany, houses: HouseUnit[] = []) {
    const list = houses || [];
    const totalHouses = list.length;
    const maxHouses = company?.planLimitHouses || MAX_HOUSES_PER_COMPANY;
    const remainingHouses = Math.max(0, maxHouses - totalHouses);
    const houseUsagePercent = Math.min(100, Math.round((totalHouses / maxHouses) * 100));

    const totalDevices = list.reduce((sum, h) => sum + (h?.registeredDevices?.length || 0), 0);
    const maxPossibleDevices = totalHouses * (company?.maxDevicesPerHouse || MAX_DEVICES_PER_HOUSE);

    return {
      totalHouses,
      maxHouses,
      remainingHouses,
      houseUsagePercent,
      totalDevices,
      maxPossibleDevices,
      isNearLimit: totalHouses >= 45,
      isAtLimit: totalHouses >= maxHouses,
    };
  }
}
