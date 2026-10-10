import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../common/utils/response.js';
import { db } from '../../db/index.js';
import { desc } from 'drizzle-orm';
import {
  warehouseReceipts,
  cargo,
  consolidations,
  shipments,
  billsOfLading,
  manifests,
  users,
  auditLogs,
  settings,
  containers,
  vessels,
  documents
} from '../../db/schema/index.js';

export class MenusController {
  // STAGE 1: CFS Dashboard
  getCfsDashboard = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const allWRs = await db.select().from(warehouseReceipts);
      const totalReceipts = allWRs.length;
      const stagedItems = allWRs.filter(w => w.status === 'Ready for Consolidation' || w.status === 'STAGED');
      
      let totalCft = 0;
      let totalCbm = 0;
      allWRs.forEach(w => {
        totalCft += Number(w.totalCft || 0);
        totalCbm += Number(w.totalCbm || 0);
      });

      // Group staged receipts dynamically by warehouse staging location
      const bayMap: Record<string, { count: number; items: string[] }> = {};
      allWRs.forEach(w => {
        const loc = w.warehouseLocation || 'Intake Staging';
        if (!bayMap[loc]) bayMap[loc] = { count: 0, items: [] };
        bayMap[loc].count += 1;
        if (bayMap[loc].items.length < 3) {
          bayMap[loc].items.push(w.receiptNumber || w.id);
        }
      });

      const bayOccupancy = Object.entries(bayMap).map(([loc, data], idx) => ({
        bay: loc,
        rack: `Section ${idx + 1}`,
        status: data.count > 0 ? 'Occupied' : 'Available',
        itemsCount: data.count,
        locationCode: loc.replace(/[^A-Za-z0-9]/g, '-').toUpperCase()
      }));

      reply.send(successResponse({
        stageName: 'Stage 1: Cargo Receiving',
        assignedUser: 'CFS Warehouse Manager',
        menuName: 'CFS Dashboard',
        metrics: {
          totalWarehouseReceipts: totalReceipts,
          stagedCargoCount: stagedItems.length,
          totalVolumeCft: Number(totalCft.toFixed(2)),
          totalVolumeCbm: Number(totalCbm.toFixed(2)),
          activeStagingBays: bayOccupancy.length,
        },
        bayOccupancy,
        recentReceipts: allWRs.slice(0, 5)
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 1 & 2: Cargo Inventory
  getCargoInventory = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const items = await db.select().from(cargo);
      reply.send(successResponse({
        stageName: 'Cargo Inventory',
        menuName: 'Cargo Inventory',
        count: items.length,
        items
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 1: Thermal 4x6 Barcode Cargo Labels
  getLabels = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id?: string };
      const allWRs = await db.select().from(warehouseReceipts);
      const targetWR = id ? allWRs.find(w => w.id === id || w.receiptNumber === id) : allWRs[0];

      if (!targetWR) {
        reply.send(successResponse({
          labelFormat: '4x6 Standard Thermal Barcode Cargo Label (Code 128)',
          receiptNumber: 'N/A',
          barcodeFormat: 'Code 128',
          barcodeValue: '000000000',
          shipper: 'No warehouse receipt found',
          consignee: 'N/A',
          destinationPort: 'N/A',
          dimensions: { lengthInches: '0', widthInches: '0', heightInches: '0' },
          weightLbs: '0',
          weightKg: '0',
          cft: '0',
          cbm: '0',
          stagingLocation: 'N/A',
          status: 'PENDING',
          printAlert: 'Create a warehouse receipt to generate labels'
        }));
        return;
      }

      const labelData = {
        labelFormat: '4x6 Standard Thermal Barcode Cargo Label (Code 128)',
        receiptNumber: targetWR.receiptNumber || targetWR.id,
        barcodeFormat: 'Code 128',
        barcodeValue: targetWR.barcode || targetWR.receiptNumber || targetWR.id,
        shipper: targetWR.shipper || targetWR.customerName || 'Shipper',
        consignee: targetWR.consignee || 'Consignee',
        destinationPort: targetWR.destinationPort || 'Port of Destination',
        dimensions: {
          lengthInches: String(targetWR.lengthInches || '0'),
          widthInches: String(targetWR.widthInches || '0'),
          heightInches: String(targetWR.heightInches || '0'),
        },
        weightLbs: String(targetWR.weightLbs || '0'),
        weightKg: String(targetWR.weightKg || '0'),
        cft: String(targetWR.totalCft || '0'),
        cbm: String(targetWR.totalCbm || '0'),
        stagingLocation: targetWR.warehouseLocation || 'Intake CFS Bay',
        status: targetWR.status || 'STAGED',
        printAlert: 'Ready for Operations Consolidation'
      };

      reply.send(successResponse(labelData));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 2: Operations Dashboard
  getOpsDashboard = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const allConsolidations = await db.select().from(consolidations);
      const allShipments = await db.select().from(shipments);
      const stagedReceipts = await db.select().from(warehouseReceipts);
      const allContainers = await db.select().from(containers);

      const awaitingConsolidation = stagedReceipts.filter(r => r.status === 'Ready for Consolidation' || r.status === 'STAGED');

      const activeContainerFill = allContainers.slice(0, 10).map(c => {
        let pct = Number(c.fillPercentage) || 0;
        if (!pct) {
          if (c.status === 'LOADED' || c.status === 'Loaded') pct = 85;
          else if (c.status === 'SEALED' || c.status === 'Sealed') pct = 100;
          else if (c.status === 'CONSOLIDATING' || c.status === 'In Consolidation') pct = 60;
          else pct = 25;
        }

        return {
          containerNumber: c.containerNumber,
          type: c.type || 'Standard',
          fillPercentage: pct,
          sealNumber: c.sealNumber || 'N/A'
        };
      });

      reply.send(successResponse({
        stageName: 'Stage 2: Container Consolidation',
        assignedUser: 'Vessel Operations Team',
        menuName: 'Operations Dashboard',
        actionableTaskCard: {
          title: `${awaitingConsolidation.length} Cargo Items Awaiting Consolidation`,
          description: 'Filter staged Warehouse Receipts by destination port to build new container run.',
          count: awaitingConsolidation.length,
          primaryCTA: '+ Build Consolidation'
        },
        metrics: {
          awaitingConsolidationCount: awaitingConsolidation.length,
          totalConsolidations: allConsolidations.length,
          activeShipmentsCount: allShipments.length,
          averageFillPercentage: activeContainerFill.length > 0
            ? `${Math.round(activeContainerFill.reduce((a, b) => a + b.fillPercentage, 0) / activeContainerFill.length)}%`
            : '0%'
        },
        activeContainerFill
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 2: Containers & Vessels
  getContainersVessels = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const allContainers = await db.select().from(containers);
      const allVessels = await db.select().from(vessels);

      const containerTypes = Array.from(new Set(allContainers.map(c => c.type).filter(Boolean)));
      if (containerTypes.length === 0) {
        containerTypes.push('20ft Standard', '40ft Standard', '40ft High Cube', '45ft High Cube');
      }

      reply.send(successResponse({
        stageName: 'Containers & Vessels',
        menuName: 'Containers & Vessels',
        containerTypes,
        containers: allContainers,
        vessels: allVessels
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 3: Documentation Desk Dashboard
  getDocsDashboard = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const blList = await db.select().from(billsOfLading);
      const manifestList = await db.select().from(manifests);

      const activeHolds = blList.filter(b => b.status === 'On Hold' || (b.holdDetails && b.holdDetails.isOnHold));
      const releasedBLs = blList.filter(b => b.status === 'Released' || b.status === 'RELEASED');

      reply.send(successResponse({
        stageName: 'Stage 3: Documentation & Customs Clearance',
        assignedUser: 'Documentation Specialist',
        menuName: 'Documentation Desk',
        metrics: {
          totalMasterBLs: blList.length,
          activeHoldLocks: activeHolds.length,
          releasedBLsCount: releasedBLs.length,
          totalManifestsGenerated: manifestList.length
        },
        primaryCTAs: ['Review B/L', '+ Create Manifest'],
        categorySwitcher: ['Master Bills of Lading (MBL)', 'House Bills of Lading (HBL)']
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 3: Shipping Manifests
  getShippingManifests = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const list = await db.select().from(manifests);
      reply.send(successResponse({
        stageName: 'Shipping Manifests',
        menuName: 'Shipping Manifests',
        total: list.length,
        exportFormats: ['CSV', 'XML'],
        manifests: list
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 3: Documents Archive
  getDocumentsArchive = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const allDocs = await db.select().from(documents);
      const docTypes = Array.from(new Set(allDocs.map(d => d.documentType).filter(Boolean)));
      if (docTypes.length === 0) {
        docTypes.push('Commercial Invoice', 'Packing List', 'Customs Entry', 'Bill of Lading PDF', 'Delivery Order');
      }

      reply.send(successResponse({
        stageName: 'Documents Archive',
        menuName: 'Documents Archive',
        documentTypes: docTypes,
        documents: allDocs
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 4: Agent Dashboard
  getAgentDashboard = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const allShipments = await db.select().from(shipments);
      const allBLs = await db.select().from(billsOfLading);
      const allVessels = await db.select().from(vessels);

      const releasedBLs = allBLs.filter(b => b.status === 'Released' || b.status === 'RELEASED');
      const pendingDOs = allBLs.filter(b => b.status !== 'Released' && b.status !== 'RELEASED');

      reply.send(successResponse({
        stageName: 'Stage 4: Destination Port Reception & Delivery',
        assignedUser: 'Destination Port Agent',
        portal: 'Restricted Destination Port Portal',
        menuName: 'Agent Dashboard',
        hiddenMenus: ['Internal Warehouse Bays', 'Pricing Settings', 'HQ Administration'],
        accessibleMenus: ['Agent Dashboard', 'My Assigned Shipments', 'Documents & B/Ls', 'Tracking'],
        metrics: {
          inboundVesselsCount: allVessels.length,
          assignedShipmentsCount: allShipments.length,
          releasedMasterBLsCount: releasedBLs.length,
          pendingDeliveryOrders: pendingDOs.length
        },
        primaryCTAs: ['Inspect Shipment', 'Download Delivery Documents']
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 4: Assigned Shipments
  getAssignedShipments = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const allShipments = await db.select().from(shipments);
      reply.send(successResponse({
        stageName: 'My Assigned Shipments',
        menuName: 'My Assigned Shipments',
        shipments: allShipments
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 4: Agent Documents & B/Ls
  getAgentDocuments = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const allBLs = await db.select().from(billsOfLading);
      const allManifests = await db.select().from(manifests);

      const availableDownloads = [
        ...allBLs.map(b => ({
          type: 'Master Bill of Lading (MBL)',
          blNumber: b.blNumber,
          holdStatus: b.status,
          downloadUrl: `/api/v1/bills-of-lading/${b.id}/pdf`
        })),
        ...allManifests.map(m => ({
          type: 'Outward Customs Manifest',
          manifestNumber: m.manifestNumber,
          format: 'CSV/XML',
          downloadUrl: `/api/v1/manifests/${m.id}/export?format=xml`
        }))
      ];

      reply.send(successResponse({
        stageName: 'Agent Documents & B/Ls',
        menuName: 'Documents & B/Ls',
        availableDownloads
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 5: Admin Dashboard
  getAdminDashboard = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const allUsers = await db.select().from(users);
      const logs = await db.select().from(auditLogs);

      reply.send(successResponse({
        stageName: 'Stage 5: System Administration & Governance',
        assignedUser: 'Marcus Vance (Administrator)',
        menuName: 'Admin Dashboard',
        accessibleMenus: ['Admin Dashboard', 'Users & Roles', 'Audit Trail Logs', 'Shipment History', 'Settings'],
        metrics: {
          totalUsersCount: allUsers.length,
          immutableAuditLogsCount: logs.length,
          activeRolePermissions: ['warehouse', 'operations', 'documentation', 'agent', 'super_admin'],
          systemStatus: 'Operational'
        },
        supervisorOverrides: {
          totalAuthorized: 2,
          notes: 'Supervisor level hold release overrides authorized by Marcus Vance'
        }
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 5: Users & Roles
  getUsersRoles = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const list = await db.select().from(users);
      reply.send(successResponse({
        stageName: 'Users & Roles',
        menuName: 'Users & Roles',
        roles: ['super_admin', 'operations', 'documentation', 'agent', 'warehouse'],
        usersCount: list.length,
        users: list
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 5: Audit Trail Logs
  getAuditTrail = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const logs = await db.select().from(auditLogs);
      reply.send(successResponse({
        stageName: 'Audit Trail Logs',
        menuName: 'Audit Trail Logs',
        immutabilityNotice: 'Immutable system audit log tracking every login, receipt created, hold placed/cleared, and manifest exported.',
        totalEvents: logs.length,
        logs
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };

  // STAGE 5: Shipment History
  getShipmentHistory = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const history = await db.select().from(shipments).orderBy(desc(shipments.createdAt));
      reply.send(successResponse({
        stageName: 'Shipment History',
        menuName: 'Shipment History',
        archivedCount: history.length,
        history
      }));
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  };
}

export const menusController = new MenusController();
