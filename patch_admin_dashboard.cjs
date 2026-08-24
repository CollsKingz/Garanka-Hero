const fs = require('fs');
let code = fs.readFileSync('src/components/dashboards/SecurityAdminDashboard.tsx', 'utf-8');

// Add to props interface
code = code.replace(
  '  onDeleteDevice: (houseId: string, deviceId: string) => void;\n}',
  '  onDeleteDevice: (houseId: string, deviceId: string) => void;\n  onUpdateDeviceApproval?: (houseId: string, deviceId: string, approvalStatus: \'approved\' | \'declined\') => void;\n}'
);

// Add to component props
code = code.replace(
  '  onDeleteDevice,\n}) => {',
  '  onDeleteDevice,\n  onUpdateDeviceApproval,\n}) => {'
);

// Add approve/decline buttons next to pending devices
const deviceButtonsStr = `
                          <div className="flex gap-1">
                            {device.approvalStatus === 'pending' && onUpdateDeviceApproval && (
                              <>
                                <button
                                  onClick={() => onUpdateDeviceApproval(house.id, device.id, 'approved')}
                                  className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => onUpdateDeviceApproval(house.id, device.id, 'declined')}
                                  className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => onDeleteDevice(house.id, device.id)}
                              className="text-slate-400 hover:text-red-600 p-1 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
`;

code = code.replace(
  `<button\n                            onClick={() => onDeleteDevice(house.id, device.id)}\n                            className="text-slate-400 hover:text-red-600 p-1"\n                          >\n                            <Trash2 className="w-3.5 h-3.5" />\n                          </button>`,
  deviceButtonsStr
);

fs.writeFileSync('src/components/dashboards/SecurityAdminDashboard.tsx', code);
