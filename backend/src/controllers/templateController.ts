import { Request, Response } from 'express';
import axios from 'axios';
import Template from '../models/Template';
import PhoneNumber from '../models/PhoneNumber';
import Account from '../models/Account';

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * GET /api/client/templates/sync
 * Sync templates from Meta Cloud API and save to database
 */
export const syncTemplates = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const accountId = (req as any).accountId as string;

    console.log('\n📋 ========== SYNCING TEMPLATES FROM META ==========');
    console.log('User ID:', userId);
    console.log('Account ID:', accountId);

    // Get account
    const account = await Account.findById(accountId).lean();
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    const wabaId = account.wabaId;
    if (!wabaId) {
      return res.status(400).json({
        success: false,
        message: 'WABA not connected. Connect WhatsApp first.'
      });
    }

    // Get phone number with access token
    const phone = await PhoneNumber.findOne({
      accountId,
      wabaId
    }).lean();

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }

    const accessToken = process.env.META_SYSTEM_TOKEN;
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Meta system token not configured'
      });
    }

    // Fetch templates from Meta
    console.log(`\n📥 Fetching templates from WABA ${wabaId}...`);

    const response = await axios.get(
      `${GRAPH_API_URL}/${wabaId}/message_templates`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,category,language,components,rejection_reason'
        }
      }
    );

    const metaTemplates = response.data?.data || [];
    console.log(`✅ Fetched ${metaTemplates.length} template(s) from Meta`);

    // Save/update templates in database
    const savedTemplates = [];
    for (const metaTemplate of metaTemplates) {
      try {
        // Parse components
        const components = metaTemplate.components || [];
        const bodyComp = components.find((c: any) => c.type === 'BODY');
        const headerComp = components.find((c: any) => c.type === 'HEADER');
        const footerComp = components.find((c: any) => c.type === 'FOOTER');
        const buttonComp = components.find((c: any) => c.type === 'BUTTONS');

        // Extract body variables
        const bodyText = bodyComp?.text || '';
        const variables = bodyComp?.parameters?.map((p: any, idx: number) => ({
          name: `{{${idx + 1}}}`,
          type: p.type || 'text',
          exampleValue: p.example || ''
        })) || [];

        // Extract buttons
        const buttons = buttonComp?.buttons?.map((btn: any) => ({
          type: btn.type,
          text: btn.text,
          phoneNumber: btn.phone_number,
          url: btn.url,
          urlType: btn.url_type
        })) || [];

        // Save template
        const template = await Template.findOneAndUpdate(
          {
            accountId,
            phoneNumberId: phone.phoneNumberId,
            templateId: metaTemplate.id,
            name: metaTemplate.name
          },
          {
            accountId,
            phoneNumberId: phone.phoneNumberId,
            wabaId,
            name: metaTemplate.name,
            templateId: metaTemplate.id,
            status: metaTemplate.status,
            category: metaTemplate.category || 'UTILITY',
            language: metaTemplate.language || 'en_US',
            headerFormat: headerComp?.format,
            headerText: headerComp?.type === 'TEXT' ? headerComp.text : undefined,
            bodyText,
            footerText: footerComp?.text,
            buttons,
            variables,
            metaSyncAt: new Date(),
            rejectionReason: metaTemplate.rejection_reason
          },
          { upsert: true, new: true }
        );

        console.log(`✅ Saved template: ${template.name} (${template.status})`);
        savedTemplates.push(template);
      } catch (err: any) {
        console.error(`❌ Error saving template ${metaTemplate.name}:`, err.message);
      }
    }

    console.log(`\n✅ TEMPLATE SYNC COMPLETE - ${savedTemplates.length} templates saved`);
    console.log('========================================\n');

    return res.json({
      success: true,
      message: `Synced ${savedTemplates.length} template(s)`,
      data: savedTemplates
    });
  } catch (error: any) {
    console.error('❌ Template sync error:', error.message);
    if (error.response?.data) {
      console.error('Meta API Error:', error.response.data);
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync templates',
      error: error.response?.data?.error
    });
  }
};

/**
 * GET /api/client/templates
 * List templates
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const accountId = (req as any).accountId as string;
    const { status, category, limit = 50, offset = 0 } = req.query;

    console.log('📋 Fetching templates:', { accountId, status, category });

    let query: any = { accountId };
    if (status) query.status = status;
    if (category) query.category = category;

    const templates = await Template.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .lean();

    const total = await Template.countDocuments(query);

    return res.json({
      success: true,
      data: templates,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    console.error('❌ Get templates error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch templates'
    });
  }
};

/**
 * POST /api/client/templates
 * Create new template
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const accountId = (req as any).accountId as string;
    const { name, category, language, bodyText, headerText, footerText, buttons, variables, phoneNumberId } = req.body;

    console.log('\n📝 Creating template:', { name, category, language });

    if (!name || !bodyText) {
      return res.status(400).json({
        success: false,
        message: 'Name and body text are required'
      });
    }

    // Get WABA ID
    const account = await Account.findById(accountId).lean();
    if (!account?.wabaId) {
      return res.status(400).json({
        success: false,
        message: 'WABA not connected'
      });
    }

    // Get phone number
    const phone = await PhoneNumber.findOne({
      accountId,
      phoneNumberId
    }).lean();

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }

    // Create template object for Meta API
    const components: any[] = [];

    // Add header if provided
    if (headerText) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: headerText
      });
    }

    // Add body (required)
    components.push({
      type: 'BODY',
      text: bodyText,
      parameters: variables?.map((v: any) => ({
        type: 'text',
        example: v.exampleValue || v.defaultValue
      })) || []
    });

    // Add footer if provided
    if (footerText) {
      components.push({
        type: 'FOOTER',
        text: footerText
      });
    }

    // Add buttons if provided
    if (buttons && buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: buttons.map((btn: any) => ({
          type: btn.type,
          text: btn.text,
          phone_number: btn.phoneNumber,
          url: btn.url,
          url_type: btn.urlType
        }))
      });
    }

    // Submit to Meta
    console.log('\n📤 Submitting template to Meta...');
    const accessToken = process.env.META_SYSTEM_TOKEN;

    const metaResponse = await axios.post(
      `${GRAPH_API_URL}/${account.wabaId}/message_templates`,
      {
        name,
        category: category || 'UTILITY',
        language: language || 'en_US',
        components
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const templateId = metaResponse.data?.id;
    console.log(`✅ Template created on Meta with ID: ${templateId}`);

    // Save to database
    const template = await Template.create({
      accountId,
      phoneNumberId: phone.phoneNumberId,
      wabaId: account.wabaId,
      name,
      templateId,
      status: 'PENDING',
      category: category || 'UTILITY',
      language: language || 'en_US',
      headerText,
      bodyText,
      footerText,
      buttons: buttons || [],
      variables: variables || [],
      metaSyncAt: new Date()
    });

    console.log(`✅ Template saved to database: ${template._id}`);

    return res.json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error: any) {
    console.error('❌ Create template error:', error.message);
    if (error.response?.data) {
      console.error('Meta API Error:', error.response.data);
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create template',
      error: error.response?.data?.error
    });
  }
};

/**
 * DELETE /api/client/templates/:templateId
 * Delete template
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const accountId = (req as any).accountId as string;

    const template = await Template.findOne({
      _id: templateId,
      accountId
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Delete from Meta
    const accessToken = process.env.META_SYSTEM_TOKEN;
    try {
      await axios.delete(
        `${GRAPH_API_URL}/${template.templateId}`,
        {
          params: { access_token: accessToken }
        }
      );
      console.log(`✅ Template deleted from Meta: ${template.name}`);
    } catch (err: any) {
      console.warn(`⚠️ Could not delete from Meta: ${err.message}`);
    }

    // Delete from database
    await Template.deleteOne({ _id: templateId });

    return res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Delete template error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete template'
    });
  }
};
